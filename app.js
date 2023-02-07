import axios from "axios"
import cheerio from "cheerio";
import express from "express";
import mongoose, { Schema } from "mongoose";


const app = express();
const PORT = 3000;


const ObjectId = mongoose.Types.ObjectId;

let url = 'https://meta.wikimedia.org/wiki/Picsart';

mongoose.connect('mongodb://localhost:27017/test', {
});

const db = mongoose.connection;


const urlSchema = new Schema({
    url: String,
    title: String,
    summary: String
});


const wordMap = new Schema({
    wordI: String,
    urlID: [
        { type: ObjectId }
    ]
});


const urlModel = mongoose.model('urlSchema', urlSchema);
const wordMapSchem = mongoose.model('words', wordMap);

axios.get(url)
    .then((res) => {
        try {
            const $ = cheerio.load(res.data);
            let title = "";
            let words = [];
            const summary_init = [];
            $('head').each((index, element) => {
                title = ($(element).find('title').text());
                $('p').each(function () {
                    const text = $(this).after('\n').text();
                    summary_init.push(text);
                })
            })
            $('body').each((index, element) => {
                const forSlpit = $(element).find('p').nextUntil().text();
                words = forSlpit.split(" ");
            });
            const urlSchem = new urlModel({
                url,
                title,
                summary: summary_init[1]
            });
            urlModel.findOneAndUpdate({
                url,
                title,
                summary: summary_init[1]
            },
                { $set: { urlSchem } },
                { upsert: true, returnOriginal: false },
                (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            urlModel.findOne({ url }, (err, res) => {
                console.log("MTAV");
                const ID = (res._id);
                words.forEach((elem) => {
                    wordMapSchem.findOneAndUpdate(
                        { wordI: elem },
                        { $addToSet: { urlID: ID } },
                        { upsert: true, new: true },
                        (err, result) => {
                            console.log(result);
                        }
                    )
                });
            });


        } catch (e) {
            console.log(e);
        }
})


app.listen(PORT);