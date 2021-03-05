const express = require('express');
const path = require('path');
const port = process.env.PORT || 8080;
const app = express();
const fileUpload = require('express-fileupload');
const ffmpeg = require('fluent-ffmpeg');
const stream = require('stream');

app.use(fileUpload());

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, './build')));

let bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000}));

app.post('/api', function (req, res) {
    if (req.files.file) {
        console.log(req.files.file)
        var bufferStream = new stream.PassThrough();
        bufferStream.end(req.files.file.data);
        var command = ffmpeg(bufferStream)
            .videoCodec('libx264')
            .format('mp4')
            // .outputOptions(
            //     '-c:v', 'mpeg4',
            //     '-c:a', 'aac', // or vorbis
            //     '-b:v', '6400k',  // video bitrate
            //     '-b:a', '4800k',  // audio bitrate
            // )
            .on('end', function (err) {
                console.log('a success happened: ' + err);
                res.send({state: "done"})
            })
            .on('error', function (err) {
                res.status(500).send({
                    message: err.message
                });
                console.log('an error happened: ' + err);
            })
            .save('vid.mp4')

        // var ffstream = command.pipe();
        // ffstream.on('data', function(chunk) {
        //     console.log('ffmpeg just wrote ' + chunk.length + ' bytes');
        // });
    }
    // res.send({state: "done"})
});

app.listen(port, () => console.log("UI server started on port 8080"));
