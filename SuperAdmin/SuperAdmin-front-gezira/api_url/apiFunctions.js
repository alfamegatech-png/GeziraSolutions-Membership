
"use server";
const {
    API_URL
} = process.env;
let storeCookie = '';
const axios = require('axios');
const options = {
    method: 'POST',
    url: `${API_URL}/web/session/authenticate/`,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    },
    data: {
        jsonrpc: '2.0',
        params: {
            db: process.env.ERP_DB,
            login: process.env.ERP_USERNAME,
            password: process.env.ERP_PASSWORD
        },
    },

};

export const authenticateUser = async () => {
   await  axios
    .request(options)
    .then(function (response) {
        const cookie =response.headers['set-cookie']
        if(cookie){
            storeCookie=cookie.join(";") 
        }

    })
    .catch(function (error) {
        console.error(error);
    });

    
  };
export const handlePostRequest = async (lastData) => {
    try {
        const response = await axios({
            method: 'post',
            url:`${API_URL}/journal/create/`,
            headers: {
             'Cookie':storeCookie
            },
            data: lastData
          });
        
        console.log('Response:', response.data);
        console.log('ok', lastData);

    } catch (error) {
        console.log('Error posting data:', error);
        console.log('not working', lastData);
    }
};
export const postAllData = (postData) => {
    postData.forEach((item) => handlePostRequest(item))
}
