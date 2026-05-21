import api from './api'

export const sendMessage = (
    message: string,
    apiKey: string,
    context: string,
    vulnerableCode: string = "",
    fixedCode: string = "",
) => {
    const formData = new FormData()
    formData.append("message", message)
    formData.append("api_key", apiKey)
    formData.append("context", context)
    formData.append("vulnerable_code", vulnerableCode)
    formData.append("fixed_code", fixedCode)
    return api.post('/chat', formData)
}
