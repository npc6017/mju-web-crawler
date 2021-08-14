const axios = require("axios");
const cheerio = require("cheerio");
const dotenv = require('dotenv');

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
        getData().then((res) => {
            console.log(res); /// TODO Delete
            /// this.update(res); TODO Open when complete 'update'
        })
        scheduleCheerio();
    }, process.env.SCHEDULECYCLE)
}

/** update request(Post) to http://****:&&&&/schedule */
const update = (data) => {
    // ToDo Update Database
}

module.exports = scheduleCheerio;