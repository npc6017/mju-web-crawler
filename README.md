## feature/schedule 회고록
Grigo 프로젝트를 진행하면서 메인화면에 학사 일정을 제공하자는 의견이 나왔다.
하지만 학교에서 제공하는 API가 없어서 직접 크롤러를 만들기로 하였다.

> **크롤러? 아니 아직은 스크랩퍼**
>
>아직은 학사 일정을 추출해오는 기능만 하여 크롤러라고 하기에는 어렵고 **스크랩퍼라고 하는 것이 맞다.**
하지만 추후 추가적인 이벤트를 통한 학교 홈페이지의 다른 정보를 추출하도록 **확장성을 고려**하려 개발하였기 때문에 **크롤러라고 명명**하였다.

## 디렉토리 구조
디렉토리 구조를 다음과 같이 하였다.

```
mju-crawler
|
|--index.js
|
|--update.js
|
|--crawling
|  |--schedule
|     |--schedule.cheerio.js
|     |--schedule.puppeteer.js
```
단순히 크롤링을 하는 것을 목적으로 두지 않고, 확장성을 갖는 프로젝트를 개발한다고 생각하고 진행하였다.

추후 추가적인 crawler가 필요하다면, crawling 디렉토리에 추가하여 기능을 확장하면 된다.
예로, 공지사항이라면, crawling 디렉토리안에 notice 디렉토리를 추가하면 된다.
DataBase에 업데이트는 기존 update모듈을 그대로 사용하면 된다.

## 크롤링 방법
크롤링 방법은 여러가지가 있지만, 대표적인 다음 두 방법을 사용하였다.
**cheerio**
**puppeteer**

왜 하나가 아닌, 두 방식으로 개발을 하였나?
>1. Crawler Bot으로 인지될 수 있다.
>2. 추가적인 이벤트가 진행된 후 페이지를 가져와야 하는 경우

cheerio를 사용하면 서버에서 Bot으로 인지하여 데이터를 받지 못하는 경우가 발생할 수 있다.
현재 명지대학교 홈페이지는 해당되지 않는 것으로 확인된다.

추가적인 이벤트, 예로 로그인이 진행된 후 볼 수 있는 페이지라면 단순히 axios를 통해 페이지를 가져올 수 없다. 이때는 puppeteer를 통해 이벤트 처리 후의 페이지를 크롤링 할 수 있다.

## 흐름
디렉토리 구조별 코드를 보며 흐름을 알아보자.
dotenv를 사용하여 모든 파일에 적용하였다.
### index.js
```javascript
const scheduleCheerio = require('./crawling/schedule/schedule.cheerio');
const schedulePuppeteer = require('./crawling/schedule/schedule.puppeteer');

/** 학사일정(schedule) */
schedulePuppeteer();
// scheduleCheerio();

/** To be added..*/
```
run파일, index.js에서는 사용할 crawler를 선택하여 실행하는 역할이다.
추후 crawler가 추가되면 여기에 추가하여 실행하면 된다.
### update.js
```javascript
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();
const header = { key: process.env.SECRETKEY }

const update = async (type, data) => {
    const date = new Date();
    // /schedule
    await axios.post(`${process.env.BASEURL}/${type}`, data, { headers: header})
        .then(() => {
            console.log(`${type}/Updated - ${date}`); // 추후 로그 파일 남기는 것으로 업데이트 예정
        })
        .catch((error) => {
            if(error.response.status == 401)
                console.error(`Error/401 - ${date}`);
            else
                console.error(`Error/Server - ${date}`); // 추후 로그 파일 남기는 것으로 업데이트 예정
        });
}

module.exports = update;
```
데이터를 크롤링한 후 데이터베이스에 업데이트를 요청하는 역할을 한다.
/schedule URI로 data를 body에 넣어 Post 요청을 보낸다.

서버에 요청후 정상적으로 응답을 받으면 응답받은 시간을 로그로 남긴다.
서버에서 문제가 발생하면 에러를 파리미터로 받긴 하지만 error로그로 간단하게 서버 문제임을 남긴다.
시크릿 키 인증에 실패하면 401 응답 받게되고 401 Error로그를 남긴다.

추후 로거를 활용하여 파일로 남기는 작업을 진행할 예정이다.

### crawling/cheerio
```javascript
/* schedule.cheerio.js */
const axios = require('axios');
const cheerio = require("cheerio");
const dotenv = require('dotenv');
const update = require('../../update');

dotenv.config();

/** parsing */
const getData = async () => {
    const result = [];
    const html = await axios.get(process.env.SCHEDULE);
    const $ = cheerio.load(html.data);
    const $sc = $("body").find(".list").children('ul').children('li');
    $sc.each(function(i, elem) {
        const text = $(this).text();
        result.push({
            date: text.substr(14, 16),
            content: text.substr(72).replace(/\t|\n/g,''),
        })
    })
    return result;
}

/** cycle */
const scheduleCheerio = () => {
    setTimeout(() => {
        getData().then(async (res) => {
            await update("schedule", res) // 예외처리는 update메서드 내에서 처리
        })
        scheduleCheerio();
    }, process.env.SCHEDULECYCLE)
}

module.exports = scheduleCheerio;
```

파싱 전략은 다음과 같다.
해당하는 클래스의 li태그를 갖는 요소를 모두 가져온다.
이후 반복문을 통해 각각 text로 모든 컨텐츠를 가져와서 길이와 정규식을 통해 처리후 리스트에 넣는다.

위 함수를 주기적으로 실행하기위해 setTimeout을 통해 재귀호출로 구현하였다.

### crawling/puppeteer
```javascript
/* schedule.puppeteer.js */
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const update = require('../../update');
dotenv.config()

/** parsing */
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

/** cycle */
const schedulePuppeteer = () => {
    setTimeout(() => {
        getData().then(async (res) => {
            await update("schedule", res) // 예외처리는 update메서드 내에서 처리
        })
        schedulePuppeteer();
    }, process.env.SCHEDULECYCLE)
}

module.exports = schedulePuppeteer;

```

파싱 전략은 cheerio와 동일하다.
차이를 둔 점은 cheerio에서는 text를 통해 전체 컨텐츠를 가져왔지만 puppeteer에서는 innerText를 통해 사람이 읽을 수 있는 요소만 가져왔다. 그래서 문자열 처리 부분이 다르다. 하지만 위 방법은 무엇을 선택하든 큰 의미는 없다.

주기적인 실행은 동일하게 구현하였다.