const s = require('superagent')
var cheerio = require('cheerio')
const db = require('./libs/DB.js')
const trim = require('trim')

const url = 'http://www.baidu.com/s?wd='

async function getWords() {
    const json = require('./assets/areas.json')
    for (let item of json) {
        await getData(item)
        for (let item2 of item.areaList) {
            await getData(item2)
            for (let item3 of item2.areaList) {
                await getData(item3)
            }
        }
    }
}

async function getData(keyword) {
    try {
        let name = encodeURI(keyword.name + '人口')
        let realurl = `${url}${name}`
        const res = await s.get(realurl)
        const $ = cheerio.load(res.text)
        let p = trim($('.op_exactqa_main .op_exactqa_s_answer').text())
        let data = {
            name: keyword.name,
            population: p,
            gdp: '',
            createtime: new Date().getTime() / 1000,
            updatetime: new Date().getTime() / 1000,
            code: keyword.code,
            url: ''
        }
        if (data.population) updateDB(data)
        else console.log(`request error: ${keyword.name}`)
    } catch (err) {
        console.log(err)
    }
}

// 更新到数据库
function updateDB(data) {
    const sql = `insert into cityinfo
    (name,population,gdp,createtime,updatetime,code,url)
    values (?,?,?,?,?,?,?)
    on duplicate key update name=?,population=?,gdp=?,updatetime=?,url=?`
    db.query(sql, [
        data.name,
        data.population,
        data.gdp,
        data.createtime,
        data.updatetime,
        data.code,
        data.url,
        data.name,
        data.population,
        data.gdp,
        data.updatetime,
        data.url
    ])
        .then(() => {
            console.log(`insert ${data.name}`)
        })
        .catch(e => {
            console.log(e)
        })
}

async function run() {
    getWords()
}

run()
