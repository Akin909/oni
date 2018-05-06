export default {
    printTwo() {
        console.log("Two from worker", 2)
        return 2
    },

    onMessage(message: any) {
        this[message.data.method](message.data.args)
    },
}
