const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const update = require('../../update');
dotenv.config()

/** parsing
 * updated role : (15/08/21)developing..
 * */
const getData = async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page =  await browser.newPage();
    await page.goto(process.env.SCHEDULE);
    const result = await page.evaluate(  () => {
        const temp = [];
        const datas = document.getElementsByClassName('list')[0].getElementsByTagName('li')
        for(let i = 0; i < datas.length; i++){
            temp.push({
                date: datas[i].innerText.substr(0, 17),
                content: datas[i].innerText.substr(18).replace(/\t|\n/g, ""),
            });
        }
        return temp;
    })
    await page.close();
    await browser.close();
    return result;
}

/** cycle, Day */
const schedulePuppeteer = () => {
    setTimeout(() => {
        getData().then(async (res) => {
            await update("schedule", res) // 예외처리는 update메서드 내에서 처리
        })
        schedulePuppeteer();
    }, process.env.SCHEDULECYCLE)
}

module.exports = schedulePuppeteer;
