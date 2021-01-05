/**
 * @Author: Resynz
 * @Date: 2021/1/5 17:33
 */
const axios = require('axios')
const qs = require('qs')
const paramMethod = ['GET', 'DELETE']
const dataMethod = ['POST', 'PUT', 'PATCH']

class NetworkHandler {
    name = 'NetworkHandler'
    log = false
    apiMaps = new Map()

    _beforeFunc (name, ...args) {
        this.log && console.log(`[${this.name}] api:【${name}】 running before function`)
        return this.beforeFunc(...args)
    }

    _afterFunc (name, cost, ...args) {
        this.log && console.log(`[${this.name}] api:【${name}】 running after function, cost:${cost} ms`)
        return this.afterFunc(...args)
    }

    timeout = 10000

    constructor ({ beforeFunc, afterFunc, apis, timeout = 10000, log = false }) {
        this.beforeFunc = beforeFunc
        this.afterFunc = afterFunc
        this.timeout = timeout
        this.log = log
        apis.forEach(v => {
            v.method = v.method.toUpperCase()
            this.apiMaps.set(v.name, v)
        })
    }

    genGetRequestUrl (name, param, headers = {}, ...args) {
        if (!name || !this.apiMaps.has(name)) {
            console.error(`[${this.name}] No such API:${name}`)
            return null
        }
        const api = this.apiMaps.get(name)
        const beforeConf = this._beforeFunc(name, param, headers, ...args)
        param = beforeConf.param || param
        let url = api.url
        const isRestful = url.includes('/:')
        if (isRestful) {
            Object.keys(param).forEach(k => {
                const tk = `:${k}`
                if (url.includes(tk)) {
                    if (url.endsWith(tk)) {
                        url = url.replace(tk, param[k])
                        delete param[k]
                    }

                    if (url.includes(tk + '/')) {
                        url = url.replace(tk + '/', param[k] + '/')
                        delete param[k]
                    }
                }
            })
        }
        return `${url}?${qs.stringify(param)}`
    }

    async sendRequest (name, param, headers = {}, ...args) {
        if (!name || !this.apiMaps.has(name)) {
            console.error(`[${this.name}] No such API:${name}`)
            return null
        }
        const api = this.apiMaps.get(name)
        const beforeConf = this._beforeFunc(name, param, headers, ...args)
        param = beforeConf.param || param
        headers = beforeConf.headers || headers
        let url = api.url
        const isRestful = url.includes('/:')
        if (isRestful) {
            Object.keys(param).forEach(k => {
                const tk = `:${k}`
                if (url.includes(tk)) {
                    if (url.endsWith(tk)) {
                        url = url.replace(tk, param[k])
                        delete param[k]
                    }

                    if (url.includes(tk + '/')) {
                        url = url.replace(tk + '/', param[k] + '/')
                        delete param[k]
                    }
                }
            })
        }
        let timeout = this.timeout
        if (api.timeout !== undefined) {
            timeout = api.timeout
        }
        const config = {
            method: api.method,
            url,
            headers,
            timeout
        }
        paramMethod.includes(api.method) && (config.params = param)
        dataMethod.includes(api.method) && (config.data = param)
        const contentType = (headers && headers['Content-Type'] && headers['Content-Type'].split(';')[0]) || null
        contentType === 'application/x-www-form-urlencoded' && (config.transformRequest = [function (data) {
            return qs.stringify(data)
        }])

        const request = new Promise((resolve, reject) => {
            axios(config).then(res => {
                resolve(res)
            }).catch(err => {
                reject((err.response && err.response.data) || err)
            })
        })
        let res
        let err = null
        let cost = Date.now()

        try {
            res = await request
        } catch (e) {
            console.error(`[${this.name}] api:【${name}】 request error:`, e.toString())
            err = e
        } finally {
            cost = Date.now() - cost
        }
        return this._afterFunc(name, cost, res, err, ...args)
    }
}

export default {
    install: (Vue, options) => {
        Vue.prototype.$networkHandler = new NetworkHandler(options)
    }
}
