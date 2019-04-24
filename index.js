const speedTest = require('speedtest-net')
const schedule = require('node-schedule')
const mongoose = require('mongoose')
const http = require('http')
const url = require('url')
const fs = require('fs')

mongoose.connect(process.env.MONGO_URL, {
  auth: {
    user: process.env.MONGO_DB_USER,
    password: process.env.MONGO_DB_PASSWORD,
  },
  useNewUrlParser: true
})

const Check = mongoose.model('Check', {
  download: Number,
  upload: Number,
  isp: String,
  host: String,
  ping: Number,
  id: Number,
  date: Date
})


let startTime = new Date(Date.now() + 1500)
// let endTime = new Date(startTime.getTime() + 5000)
// var j = schedule.scheduleJob({ startTime }, () => {
var j = schedule.scheduleJob({start: startTime, rule: '*/5 * * * *'}, () => {
  console.log('Start test')
  const test = speedTest({maxTime: 5000})
  test.on('data', data => {
    console.log('Got speed data')
    if (data && data.speeds) {
      const {
        speeds: {
          download,
          upload,
        },
        client: { isp },
        server: { host, ping, id },
      } = data
      const date = new Date()
      const check = new Check({
        download,
        upload,
        isp,
        host,
        ping,
        id,
        date,
      })
      check.save().then(() => {
        console.log('New check saved ', date)
        console.log('Next test at ', new Date(date.getTime() + 5*60000))
      })
    }
  })
  
  test.on('error', err => {
    console.error(err)
  })

})

http.createServer( (req, res) => {
  Check.find((err, checks) => {
    if (err) return console.error(err)
    res.writeHead(200, {'Content-Type': 'application/json'})
    res.write(JSON.stringify(checks))
    res.end()
  })
}).listen(8080)