import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import api from "../services/api";

export default function MessagePage() {
	const user = useSelector((state) => state.auth.user);
	const [rooms, setRooms] = useState([]);
	const [followingProfiles, setFollowingProfiles] = useState([]);
	const [activeRoom, setActiveRoom] = useState(null);
	const [messages, setMessages] = useState([]);
	const [nextCursor, setNextCursor] = useState(null);
	const [hasMore, setHasMore] = useState(false);
	const [text, setText] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [loadingRooms, setLoadingRooms] = useState(false);
	const [followingLoading, setFollowingLoading] = useState(false);
	const [loadingMessages, setLoadingMessages] = useState(false);
	const bottomRef = useRef(null);
	const activeRoomRef = useRef(null);

	// keep activeRoomRef in sync
	useEffect(() => {
		activeRoomRef.current = activeRoom;
	}, [activeRoom]);

	useEffect(() => {
		if (!user?.id) return;
		fetchFollowing();
		fetchRooms();

		let socketHandler = null;

		const attachSocket = () => {
			const socket = window.__socket;
			if (!socket) return;

			socketHandler = (payload) => {
				if (!payload || !payload.roomId) return;
				const currentActiveRoom = activeRoomRef.current;
				// If active room matches, append
				if (currentActiveRoom && payload.roomId.toString() === currentActiveRoom._id.toString()) {
					setMessages((p) => [...p, payload]);
					// mark read for active room
					markRead(currentActiveRoom._id, payload.messageNumber);
				}
				// update rooms preview and ordering
				setRooms((prev) => {
					const idx = prev.findIndex((r) => r._id === payload.roomId.toString());
					if (idx === -1) return prev;
					const copy = [...prev];
					copy[idx] = { 
						...copy[idx], 
						lastMessage: { content: payload.content, sender: payload.sender }, 
						lastMessageAt: Date.now(), 
						currentMessageCount: (copy[idx].currentMessageCount || 0) + 1 
					};
					// move to top
					const moved = copy.splice(idx, 1)[0];
					return [moved, ...copy];
				});
			};

			socket.on("new-message", socketHandler);
		};

		attachSocket();

		const onSocketReady = () => {
			if (socketHandler) {
				window.__socket?.off("new-message", socketHandler);
			}
			attachSocket();
		};

		window.addEventListener("socket-ready", onSocketReady);

		return () => {
			window.removeEventListener("socket-ready", onSocketReady);
			if (window.__socket && socketHandler) {
				window.__socket.off("new-message", socketHandler);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	useEffect(() => {
		// scroll to bottom whenever messages change
		if (bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	async function fetchFollowing() {
		if (!user?.id) return;
		try {
			setFollowingLoading(true);
			const res = await api.get(`/profile/get-following/${user.id}`);
			setFollowingProfiles(res.data.following || []);
		} catch (err) {
			console.error(err);
		} finally {
			setFollowingLoading(false);
		}
	}

	async function startChat(profile) {
		try {
			const res = await api.post("/message/create-room", {
				participants: [profile.userId],
			});
			const room = res.data.room;
			const roomWithInfo = {
				...room,
				dmUserInfo: {
					_id: profile.userId,
					username: profile.username,
					profilePicture: { profileView: profile.profilePicture },
				},
			};
			setRooms((prev) => [roomWithInfo, ...prev.filter((r) => r._id !== roomWithInfo._id)]);
			openRoom(roomWithInfo);
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || err.message || "Failed to start chat");
		}
	}

	async function fetchRooms() {
		try {
			setLoadingRooms(true);
			const res = await api.get("/message/get-rooms");
			setRooms(res.data.userRooms || []);
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || err.message || "Failed to load rooms");
		} finally {
			setLoadingRooms(false);
		}
	}

	async function openRoom(room) {
		setActiveRoom(room);
		setMessages([]);
		setNextCursor(null);
		setHasMore(false);
		await fetchMessages(room._id, null, true);
		// mark read later when messages loaded
	}

	async function fetchMessages(roomId, cursor = null, replace = false) {
		try {
			setLoadingMessages(true);
			const params = {};
			if (cursor) params.cursor = cursor;
			params.limit = 50;
			const res = await api.get(`/message/get-messages/${roomId}`, { params });
			const arr = res.data.messageArray || [];
			// backend returns newest first (desc) â€” reverse to show oldest->newest
			const ordered = arr.slice().reverse();
			if (replace) setMessages(ordered);
			else setMessages((p) => [...ordered, ...p]);
			setNextCursor(res.data.nextCursor);
			setHasMore(res.data.hasMore);
			// after loading latest, mark read
			if (replace && ordered.length > 0) {
				const last = ordered[ordered.length - 1];
				await markRead(roomId, last.messageNumber);
			}
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || err.message || "Failed to load messages");
		} finally {
			setLoadingMessages(false);
		}
	}

	async function loadMore() {
		if (!activeRoom || !hasMore) return;
		// oldest message's messageNumber is the cursor for older messages
		const first = messages[0];
		const cursor = first ? first.messageNumber : null;
		await fetchMessages(activeRoom._id, cursor, false);
	}

	async function sendMessage(e) {
		e?.preventDefault();
		if (!text.trim() || !activeRoom) return;
		try {
			const res = await api.post("/message/send-message", { roomId: activeRoom._id, content: text });
			const newMsg = res.data.message;
			setMessages((p) => [...p, newMsg]);
			setText("");
			// update room preview + move to top
			setRooms((prev) => {
				const idx = prev.findIndex((r) => r._id === activeRoom._id);
				if (idx === -1) return prev;
				const copy = [...prev];
				copy[idx] = { ...copy[idx], lastMessage: { content: newMsg.content, sender: newMsg.sender }, lastMessageAt: Date.now(), currentMessageCount: newMsg.messageNumber };
				const moved = copy.splice(idx, 1)[0];
				return [moved, ...copy];
			});
			// mark read for this room
			await markRead(activeRoom._id, newMsg.messageNumber);
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || err.message || "Failed to send message");
		}
	}

	async function markRead(roomId, latestMessageNumber) {
		try {
			await api.put("/message/mark-message-read", { roomId, latestMessageNumber });
			// update local room unread count
			setRooms((prev) => prev.map((r) => (r._id === roomId ? { ...r, unreadCount: 0 } : r)));
		} catch (err) {
			// non-fatal
		}
	}

	const filteredRooms = rooms.filter((r) => {
		const title = r.roomType === "dm" ? r.dmUserInfo?.username || "Direct Message" : r.roomName;
		return title.toLowerCase().includes(searchTerm.toLowerCase());
	});

	const getProfileImage = (profile) =>
		profile.profilePicture?.profileView ||
		profile.profilePicture ||
		profile.profilePicture?.original?.url ||
		"";

	const renderFollowingProfile = (profile) => {
		const profileImage = getProfileImage(profile);
		return (
			<button
				key={profile.userId}
				onClick={() => startChat(profile)}
				className="flex w-full items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
			>
				<div className="h-12 w-12 overflow-hidden rounded-full bg-slate-200">
					{profileImage ? (
						<img src={profileImage} alt={profile.username} className="h-full w-full object-cover" />
					) : (
						<div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-600">{profile.username?.[0]}</div>
					)}
				</div>
				<div className="min-w-0">
					<div className="font-semibold text-slate-900">{profile.username}</div>
					<div className="mt-1 text-sm text-slate-500">Start chat</div>
				</div>
			</button>
		);
	};

	return (
		<div className="flex h-screen min-h-screen overflow-hidden bg-slate-100 text-slate-900 lg:pl-[72px]">
			<div className="hidden min-h-0 flex-col border-r border-slate-200 bg-white xl:flex xl:w-[320px]">
				<div className="border-b p-4">
					<div className="flex items-center justify-between gap-3">
						<div>
							<h2 className="text-lg font-semibold">Messages</h2>
							<p className="text-sm text-slate-500">Latest conversations</p>
						</div>
						<button onClick={fetchFollowing} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50">
							+
						</button>
					</div>
				</div>
				<div className="border-b px-4 py-4">
					<div className="mb-3">
						<input
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Search conversations"
							className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
						/>
					</div>
					<div className="flex items-center justify-between text-sm font-semibold text-slate-700">
						<span>Latest First</span>
						<button className="text-blue-600 hover:underline">Sort</button>
					</div>
				</div>
				<div className="overflow-auto border-t border-slate-200 p-4">
					{followingLoading ? (
						<div className="text-sm text-slate-500">Loading profiles...</div>
					) : followingProfiles.length === 0 ? (
						<div className="text-sm text-slate-500">No profiles found.</div>
					) : (
						<div className="space-y-3">
							{followingProfiles.map(renderFollowingProfile)}
						</div>
					)}
				</div>
			</div>
		<div className="flex min-h-0 flex-1 flex-col">
				<div className="border-b bg-white p-4">
					<div className="font-semibold text-slate-900">{activeRoom ? (activeRoom.roomType === 'dm' ? (activeRoom.dmUserInfo?.username || 'DM') : activeRoom.roomName) : 'Select a conversation'}</div>
					<div className="mt-1 text-sm text-slate-500">{activeRoom ? (activeRoom.roomType === 'dm' ? 'Chat with your friend' : 'Group conversation') : 'Choose a chat to view messages'}</div>
				</div>
				<div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-6">
					{!activeRoom && (
						<div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9-7-9-7-9 7 9 7z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12l9-7" opacity="0.4" />
							</svg>
							<h3 className="mt-6 text-xl font-semibold text-slate-700">Your messages</h3>
							<p className="mt-2 text-sm text-slate-500">Select a chat from the left to continue.</p>
						</div>
					)}
					{activeRoom && (
						<div className="flex flex-col gap-4">
							{loadingMessages && <div className="text-sm text-slate-500">Loading messages...</div>}
							{hasMore && <button onClick={loadMore} className="text-sm text-blue-600 hover:underline">Load earlier messages</button>}
							<div className="space-y-3">
								{messages.map((m) => (
									<div key={m._id} className={`max-w-[72%] rounded-3xl p-4 shadow-sm ${m.sender === user?._id ? 'ml-auto bg-blue-600 text-white' : 'bg-white text-slate-900'}`}>
										<div className="text-sm leading-relaxed">{m.content}</div>
										<div className="mt-2 text-right text-xs text-slate-400">{m.isEdited ? 'edited Â· ' : ''}{new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
									</div>
								))}
								<div ref={bottomRef} />
							</div>
						</div>
					)}
				</div>
				<form onSubmit={sendMessage} className="flex items-center gap-3 border-t border-slate-200 bg-white p-4">
					<button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-100">ðŸ“Ž</button>
					<input
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder={activeRoom ? "Write a message..." : "Select a conversation to message"}
						disabled={!activeRoom}
						className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed"
					/>
					<button type="submit" disabled={!activeRoom || !text.trim()} className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50">Send</button>
				</form>
			</div>
			<div className="hidden flex-col border-l border-slate-200 bg-white xl:flex xl:w-[300px]">
				<div className="border-b p-6 text-center">
					<div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-slate-200">
						{(() => {
							const profileImage =
								activeRoom?.dmUserInfo?.profilePicture?.profileView ||
								activeRoom?.dmUserInfo?.profilePicture ||
								activeRoom?.dmUserInfo?.profilePicture?.original?.url;
							return profileImage ? (
								<img src={profileImage} alt={activeRoom.dmUserInfo?.username} className="h-full w-full object-cover" />
							) : (
								<div className="flex h-full w-full items-center justify-center text-xl text-slate-500">{activeRoom?.dmUserInfo?.username?.[0]}</div>
							);
						})()}
					</div>
					<div className="text-lg font-semibold text-slate-900">{activeRoom?.dmUserInfo?.username || 'Select a chat'}</div>
					<p className="mt-2 text-sm text-slate-500">{activeRoom?.dmUserInfo ? 'Personal blog' : 'Conversation details'}</p>
					<p className="mt-3 text-sm leading-6 text-slate-500">{activeRoom?.dmUserInfo ? 'This is a quick preview of the selected conversation partner. Tap view profile to learn more.' : 'Pick a chat from the left to see profile details.'}</p>
					<button className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">View profile</button>
				</div>
				<div className="flex flex-1 flex-col justify-between gap-4 p-6">
					<div className="grid grid-cols-2 gap-3">
						<button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A2 2 0 0122 9.618v4.764a2 2 0 01-2.447 1.894L15 14m-6 0l-4.553 2.276A2 2 0 012 14.382V9.618a2 2 0 012.447-1.894L9 10m6 0H9" />
							</svg>
							Call
						</button>
						<button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A2 2 0 0122 9.618v4.764a2 2 0 01-2.447 1.894L15 14m-6 0l-4.553 2.276A2 2 0 012 14.382V9.618a2 2 0 012.447-1.894L9 10m6 0H9" />
							</svg>
							Video
						</button>
					</div>
					<div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500">
						<span className="block font-semibold text-slate-900">About this chat</span>
						<span className="mt-3 block leading-6">Use this panel to preview the selected profile and access quick actions while chatting.</span>
					</div>
				</div>
			</div>
		</div>
	);
}



