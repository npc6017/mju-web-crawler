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