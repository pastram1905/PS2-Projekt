import axios from "axios"


const mattermostApi = axios.create({
    baseURL: "http://127.0.0.1:8000/mattermost",
    withCredentials: true
})

export default mattermostApi
