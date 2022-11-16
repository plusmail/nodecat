const express = require('express');
const axios = require('axios');

const router = express.Router();
const URL = 'http://localhost:8002/v2';

axios.defaults.headers.origin = 'http://localhost:4000'; // origin 헤더 추가
const request = async (req, api) => {
    try {
        if (!req.session.jwt) { // 세션에 토큰이 없으면
            const tokenResult = await axios.post(`${URL}/token`, {
                clientSecret: process.env.CLIENT_SECRET,
            });
            req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장
        }
        return await axios.get(`${URL}${api}`, {
            headers: { authorization: req.session.jwt },
        }); // API 요청
    } catch (error) {
        if (error.response.status === 419) { // 토큰 만료시 토큰 재발급 받기
            delete req.session.jwt;
            return request(req, api);
        } // 419 외의 다른 에러면
        return error.response;
    }
};

const request_post = async (req, api, data) => {
    try {
        if (!req.session.jwt) { // 세션에 토큰이 없으면
            const tokenResult = await axios.post(`${URL}/token`, {
                clientSecret: process.env.CLIENT_SECRET,
            });
            req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장
        }
        return await axios.post(`${URL}${api}`, { data : data},{
            headers: { authorization: req.session.jwt},
        }); // API 요청
    } catch (error) {
        if (error.response.status === 419) { // 토큰 만료시 토큰 재발급 받기
            delete req.session.jwt;
            return request(req, api);
        } // 419 외의 다른 에러면
        return error.response;
    }
};




router.get('/mypost', async (req, res, next) => {
    try {
        const result = await request(req, '/posts/my');
        // res.json(result.data);
        console.log(result.data);
        res.render('postlist', {"title":result.data.payload})
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/myguestbook', async (req, res, next) => {
    try {
        const result = await request(req, '/guestbooks/my');
        // res.json(result.data);
        console.log(result.data);
        res.render('guestbook', {"title":result.data.payload})
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/guestbookform',(req, res, next) =>{
        res.render('guestform');
});

router.post('/guestbookcreate',async (req, res, next) =>{
    const {name, email, content} = req.body;
    let data = { "name": name, "email": email, "content": content }
    console.log("55555555->", data);
    try{
        const result = await request_post(req,'/guestbooks/create', data);
        // res.json(result.data);
        // return result.status == 200 ? result.data : "error";
        if( result.data.code === 200){
            res.redirect('/myguestbook');
        }

    }
    catch (error) {
        console.error(error);
        // next(error);
    }
});

router.get("/guestbooks/delete/:id", async (req, res, next) =>{
    try {
        const result = await request(req, '/guestbooks/delete/'+req.params.id);
        // res.json(result.data);
        console.log(result.data);
        if( result.data.code === 200){
            res.redirect('/myguestbook');
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
})

router.get("/guestbooks/update/:id", async (req, res, next) =>{
    try {
        const result = await request(req, '/guestbooks/update/'+req.params.id);
        // res.json(result.data);
        console.log(result.data);
        if( result.data.code === 200){
            res.render("guestupdate",{"guestbooks":result.data.payload });
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
})


router.post('/guestbookupdate',async (req, res, next) =>{
    const {id, name, email, content} = req.body;
    let data = { "id": id , "name": name, "email": email, "content": content }
    console.log("55555555->", data);
    try{
        const result = await request_post(req,'/guestbooks/update', data);
        // res.json(result.data);
        // return result.status == 200 ? result.data : "error";
        if( result.data.code === 200){
            res.redirect('/myguestbook');
        }

    }
    catch (error) {
        console.error(error);
        // next(error);
    }
});




router.get('/search/:hashtag', async (req, res, next) => {
    try {
        const result = await request(
            req, `/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`,
        );
        res.json(result.data);
    } catch (error) {
        if (error.code) {
            console.error(error);
            next(error);
        }
    }
});

router.get('/', (req, res) => {
    res.render('main', { key: process.env.CLIENT_SECRET });
});

module.exports = router;
