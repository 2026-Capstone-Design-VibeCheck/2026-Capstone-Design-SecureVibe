import api from './api'

export const sendMessage = (message: string, apiKey: string, context: string) => {
    const formData = new FormData()
    formData.append("message", message)
    formData.append("api_key", apiKey)
    formData.append("context", context)
    return api.post('/chat', formData)
}