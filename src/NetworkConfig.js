/**
 * @Author: Resynz
 * @Date: 2021/1/5 17:33
 */
export default {
    /**
     * 请求发送前执行
     * @param param
     * @param headers
     * @return {{headers: *, param: *}}
     */
    beforeFunc (param, headers = {}) {
        return {
            param,
            headers
        }
    },

    /**
     * 响应回来后执行
     * @param res
     * @param err
     * @return {*|null}
     */
    afterFunc (res, err) {
        return err || res && res.data
    },
    timeout: 15000,
    log: true,
    apis: []
}
