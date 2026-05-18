import {createContext,useState,useEffect} from "react";
export const AuthContext=createContext()
export function AuthProvider({children}){
    const [user,setUser]=useState()
    useEffect(()=>{
        const storedUser=localStorage.getItem("user")
        const storedToken=localStorage.getItem("token")
        if(storedToken && storedUser){
            setUser(JSON.parse(storedUser))

        }
    },[])

    function login(data){
        setUser(data.user)
        localStorage.setItem("token",data.accessToken)
        localStorage.setItem("user",JSON.stringify(data.user))

    }
    function logout(){
        setUser(null)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
    }
    return(
        <AuthContext.Provider value={{login,user,logout}}>
            {children}
        </AuthContext.Provider>
    )
}
