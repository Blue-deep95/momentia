// This page is mainly for axios instance that is used for 
import axios from 'axios'

// create axios instance 
const api = axios.create({
    baseURL:"http://localhost:2000/api", // could be production url using .env files
    withCredentials:true,
    //timeout: 5000 // Add a 5-second timeout
})

api.interceptors.request.use((config)=>{
    // get the token from localstorage
    const token = localStorage.getItem("token")
    if (token){
        config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
},
(error) =>{
    return Promise.reject(error)
}
)

// variables that help unnecessary requests while request is getting 
// access token from server
let isRefreshing = false
let failedQueue = [] // the queue is mainly for requests that failed

// helper function to process waiting room
const processQueue = (error ,token=null)=>{
    failedQueue.forEach((prom) => {
        if(error){
            prom.reject(error)
        }
        else{
            prom.resolve(token)
        }
    })
    // clear the queue once everyone is processed
    failedQueue = []
}


// The interceptor
api.interceptors.response.use(
    (response) => response, // if there are no errors at all just continue as usual
    async (error)=>{
        const originalRequest = error.config

        // check if the error is 401 or not and we have not retried this specific request again
        if (error.response?.status === 401 && !originalRequest._retry){
            
            // we encountered a 401 is the token already refreshing?
            if (isRefreshing){
                // if true put this request in waiting room
                return new Promise(function(resolve,reject){
                    failedQueue.push({resolve,reject})
                })
                .then((token)=>{
                    // once the queue is resolved attatch the new token
                    originalRequest.headers['Authorization'] = `Bearer ${token}`
                    return api(originalRequest)
                })
                .catch(err =>{
                    return Promise.reject(err)
                })
            }

            // if the above is false then we are the first request 
            originalRequest._retry = true
            isRefreshing = true
            try{
                // get new access token from refresh token
                const res = await axios.post("http://localhost:2000/api/user/regenerate-access-token",
                    {},
                    {withCredentials:true}
                )
                const newAccessToken = res.data.accessToken
                console.log('Got new access token 👌')
                localStorage.setItem("token",newAccessToken)

                // tell the waiting queue and give them the new access token
                processQueue(null,newAccessToken)

                // retry the first request 
                originalRequest.headers['Authorization'] = "Bearer " + newAccessToken

                return api(originalRequest)

            }
            catch(err){
                // if an error happens at this point the refreshtoken is invalid or expired
                processQueue(err,null)
                console.log('invalid token 😒')
                // delete items from localstorage and try to log the user out
                // uncomment later
                localStorage.removeItem("token")
                localStorage.removeItem("user")

                return Promise.reject(err)
            }
            finally{
                // set is refreshing to false whatever the outcome might be
                isRefreshing = false
            }
        }

        // IF THIS IS A ERROR OTHER THAN 401 THEN THROW IT NORMALLY
        return Promise.reject(error)
    }

)

export default api
