const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();
const update = async (type, data) => {
    const date = new Date();
    // /schedule
    await axios.post(`${process.env.BASEURL}/${type}`, data)
        .then(() => {
            console.log(`${type}/Updated - ${date}`); // 추후 로그 파일 남기는 것으로 업데이트 예정
        })
        .catch((error) => {
        console.error("서버에서 문제가 발생하였습니다."); // 추후 로그 파일 남기는 것으로 업데이트 예정
    });
}

module.exports = update;