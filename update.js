const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();
const update = async (type, data) => {
    // /schedule
    await axios.post(`${process.env.BASEURL}/${type}`, data).catch((error) => {
        console.error("서버에서 문제가 발생하였습니다.")
    });
}

module.exports = update;