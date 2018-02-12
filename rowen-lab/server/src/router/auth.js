'use strict'

import {Router} from 'express';
import User from '../model/user.js';
import bodyParser from 'body-parser';
import basicAuth from '../middleware/basic-auth.js';
import superagent from 'superagent';

export default new Router()

    .post('/signup', bodyParser.json() , (req, res, next) => {

        new User.createFromSignup(req.body)
            .then(user => user.tokenCreate())
            .then(token => {
                res.cookie('X-BBB-Token', token);
                res.send(token);
            })
            .catch(next);
    })

    .get('/usernames/:username', (req, res, next) => {

        User.findOne({username: req.params.username})
            .then(user => {
                if(!user) {
                    return res.sendStatus(200);
                }
                return res.sendStatus(409);
            })
            .catch(next);
    })

    .get('/login', basicAuth, (req, res, next) => {

        req.user.tokenCreate()
            .then((token) => {
                res.cookie('X-BBB-Token', token);
                res.send(token);
            })
            .catch(next);
    })

    .get('/oauth/google/code', async (req, res, next) => {
      let gCode = req.query.code;
      console.log('gCode', gCode);

      let gObj = {
            code: code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${process.env.API_URL}/oauth/google/code`,
            grant_type: 'authorization_code'
        }


      let gURL = 'https://www.googleapis.com/oauth2/v4/token';
      let gToken = await superagent.post(gURL)
        .type('form')
        .send(gObj)
        .body.access_token;

      console.log('gResponse', gResponse);

      let gConnect = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
      let gUser = await superagent.get(gConnect)
        .set('Authorization', `bearer ${gToken}`)
        .res.body;

      let bearerToken = User.createFromOAuth(gUser).tokenCreate();

      res.cookie ('X-BBB-Token', bearerToken);
      res.redirect(process.env.CLIENT_UTL);

    })
