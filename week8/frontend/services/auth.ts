import api from './api'

export const login = (id: string, password: string) => {
    const formData = new FormData()
    formData.append("id", id)
    formData.append("password", password)
    return api.post('/login', formData)
}

export const signup = (sid: string, sname: string, spassword: string, sapikey: string) => {
    const formData = new FormData()
    formData.append("sid", sid)
    formData.append("sname", sname)
    formData.append("spassword", spassword)
    formData.append("sapikey", sapikey)
    return api.post('/signup', formData)
}