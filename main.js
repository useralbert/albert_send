//Load the required libraries
const express = require('express');
const hbs = require('express-handlebars');
const request = require('request');
const bodyParser = require('body-parser');
const mysql = require('mysql');

//SQL statement
const SQL_BOOK_TITLE_WHERE  = 'select title from book2018 where title like ? limit ? offset ?';
const SQL_BOOK_TITLE_ALL_WHERE  = 'select * from book2018 where title like ? limit ? offset ?';

//Create an MySQL connection pool
const pool = mysql.createPool(require('./config.json'));

//Load application keys
const keys = require('./keys.json');

//Configure the PORT
const PORT = parseInt(process.argv[2] || process.env.APP_PORT || 3000);

//Create an instance of the application
const app = express();

//Configure handlebars
app.engine('hbs', hbs());
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.use(bodyParser.urlencoded({ extended: true }));
 
//Route
app.get('/getbooklist', (req, resp) => {
    const q = req.query.q;
    console.log('q: ', q);
    //Checkout a connection from the pool
    pool.getConnection((err, conn) => {
        if (err) {
            resp.status(500);
            resp.type('text/plain');
            resp.send(err);
             return;
        }
        //Perform our query
        conn.query(SQL_BOOK_TITLE_WHERE,
            [ `%${q}%`, 10, 0 ],
            (err, result) => {
            //Release the connection
                conn.release();
                console.info(result);
                console.info(result[0]);
                if (err) {
                    resp.status(500);
                    resp.type('text/plain');
                    resp.send(err);
                    return;
                }
                resp.status(200);
                resp.type('text/html');
                resp.render('booktitle', { 
                    q: q,
                    prev_pg: result.offset - result.count ,
                    next_pg: result.offset + result.count ,
                    count: result.count,
                    disable_prev: (offset <= 0)? "disabled": "",
                    disable_next: ((offset + count) >= result.total_count)? "disabled": "",
                    layout: false
                });
            }
        )
    });
})

app.get('/search', (req, resp) => {
	const q = req.query.q;
	const count = parseInt(req.query.count) || 10;
    const offset = parseInt(req.query.offset) || 0;
//Checkout a connection from the pool
pool.getConnection((err, conn) => {
    if (err) {
        resp.status(500);
        resp.type('text/plain');
        resp.send(err);
         return;
    }
    //Perform our query
    conn.query(SQL_BOOK_TITLE_WHERE,
        [ `%${q}%`, 10, `%${offset}%` ],
        (err, result) => {
        //Release the connection
            conn.release();
            console.info(result);
            console.info(result[1]);
            if (err) {
                resp.status(500);
                resp.type('text/plain');
                resp.send(err);
                return;
            }
            resp.status(200);
            resp.type('text/html');
            resp.render('booktitle', { 
                q: q,
                prev_pg: result.offset - result.count ,
                next_pg: result.offset + result.count ,
                count: result.count,
                disable_prev: (offset <= 0)? "disabled": "",
                disable_next: ((offset + count) >= result.total_count)? "disabled": "",
                layout: false
            });
        }
    )
});
})    

app.get('/bookinfo/:title', (req, resp) => {
    const title = parseInt(req.params.title);
    empPool.getConnection((err, conn) => {
        conn.query(SQL_BOOK_TITLE_ALL_WHERE, [ title ],
            (err, result) => {
                conn.release();
                if (result.length <= 0) {
                    resp.status(404);
                    resp.send("Not found");
                    return;
                }
                console.log('Result: %s %d ', empId, result[0].book_id);
                console.info(result[0]);
                resp.status(200);
                resp.render('/bookdetail.hbs', {
                    title: result[0].title,
                    authors: result[0].authors,
                    number: result[0].number,
                    rating: result[0].rating,
                    rating_count: result[0].rating_count,
                    genre: result[0].genre,
                    book_cover: result[0].image_url
                })
            }
        )
    })
})


)



app.post('/list', (req, resp) => {
    console.log('body: ', req.body)
    console.log('item0 = ', req.body.item0);
    console.log('item1 = ', req.body['item1']);

    resp.status(201);
    resp.type('text/html');
    resp.send(`Your list has been created`);
})


app.get('/getreview', (req, resp) => {
    

    const params = {

        appid: keys.nyt.appid

    };

    request.get('https://developer.nytimes.com/docs/books-product/1/routes/reviews.json/get', 
        { qs: params },
        (err, _, body) => {
            if (err) {
                resp.status(400); resp.type('text/plain'); resp.send(err); return;
            }
            const result = JSON.parse(body);
            resp.status(200);
            resp.format({
                'text/html': () => {
                    resp.type('text/html');
                    resp.render('review', {
                        layout: false,
                        book_title: result
                        
                    })
                },
                'application/json': () => {
                    const respond = {
                        
                        review: result.review.map(v => {
                            return {
                                main: v.main,
                                description: v.description,
                        
                            }
                       })
                    }
                    resp.json(respond)
                },
                'default': () => {
                    resp.status(406);
                    resp.type('text/plain');
                    resp.send(`Cannot produce the requested representation: ${req.headers['accept']}`);
                }
            })
        }
    );
});

app.get(/.*/, express.static(__dirname + '/public'));

//Start the server
app.listen(PORT, () => {
    console.info(`Application started on port ${PORT} at ${new Date()}`);
});