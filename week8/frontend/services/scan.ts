import api from './api'

export const scanFile = (formData: FormData) => {
    return api.post('/scan', formData)
}

export const scanUrl = (url: string) => {
    const formData = new FormData()
    formData.append("codeurl", url)
    return api.post('/scan', formData)
}