const express = require('express');
const bodyParser = require('body-parser');
const dbUtils = require('./dbUtils');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware to add flash messages
app.use((req, res, next) => {
    res.locals.alertMessage = req.query.message || '';
    res.locals.alertType = req.query.type || 'info';
    next();
});

// Home route to list all items
app.get('/', (req, res) => {
    dbUtils.selectAll('items', (err, results) => {
        if (err) {
            console.error('Error fetching all items:', err);
            return res.status(500).send('Error fetching items');
        }
        res.render('index', { items: results });
    });
});

// Route to render form for adding a single item
app.get('/add', (req, res) => {
    res.render('add');
});

// Route to handle adding a single item
app.post('/add', (req, res) => {
    const { name, description } = req.body;
    const data = { name, description };

    dbUtils.insert('items', data, (err, result) => {
        if (err) {
            console.error('Error adding single item:', err);
            return res.redirect('/?message=Error%20adding%20item&type=danger');
        }
        res.redirect('/?message=Item%20added%20successfully&type=success');
    });
});

// Route to render form for updating a single item
app.get('/update/:id', (req, res) => {
    const id = req.params.id;
    dbUtils.selectOne('items', id, (err, results) => {
        if (err) {
            console.error('Error fetching item for update:', err);
            return res.status(500).send('Error fetching item for update');
        }
        res.render('update', { item: results[0] });
    });
});

// Route to handle updating a single item
app.post('/update/:id', (req, res) => {
    const id = req.params.id;
    const { name, description } = req.body;
    const data = { name, description };

    dbUtils.updateOne('items', id, data, (err, result) => {
        if (err) {
            console.error('Error updating item:', err);
            return res.redirect('/?message=Error%20updating%20item&type=danger');
        }
        res.redirect('/?message=Item%20updated%20successfully&type=success');
    });
});

// Route to render form for adding multiple items
app.get('/add-multiple', (req, res) => {
    res.render('add-multiple');
});

// Route to handle adding multiple items
app.post('/add-multiple', (req, res) => {
    const names = req.body['name[]'];
    const descriptions = req.body['description[]'];

    if (!names || !descriptions || names.length !== descriptions.length) {
        return res.redirect('/?message=Invalid%20data%20received%20for%20adding%20multiple%20items&type=danger');
    }

    const data = names.map((name, index) => ({
        name: name,
        description: descriptions[index]
    }));

    dbUtils.insertMany('items', data, (err, result) => {
        if (err) {
            console.error('Error adding multiple items:', err);
            return res.redirect('/?message=Error%20adding%20multiple%20items&type=danger');
        }
        res.redirect('/?message=Multiple%20items%20added%20successfully&type=success');
    });
});

// Route to render form for updating multiple items
app.get('/update-multiple', (req, res) => {
    dbUtils.selectAll('items', (err, results) => {
        if (err) {
            console.error('Error fetching items for update multiple:', err);
            return res.status(500).send('Error fetching items for update');
        }
        res.render('update-multiple', { items: results });
    });
});

// Route to handle updating multiple items
app.post('/update-multiple', (req, res) => {
    const ids = req.body['id[]'];
    const names = req.body['name[]'];
    const descriptions = req.body['description[]'];

    if (!ids || !names || !descriptions || ids.length !== names.length || ids.length !== descriptions.length) {
        return res.redirect('/?message=Invalid%20data%20received%20for%20updating%20multiple%20items&type=danger');
    }

    const data = ids.map((id, index) => ({
        id: id,
        name: names[index],
        description: descriptions[index]
    }));

    data.forEach(item => {
        dbUtils.updateOne('items', item.id, { name: item.name, description: item.description }, (err, result) => {
            if (err) {
                console.error('Error updating item ID:', item.id, err);
            }
        });
    });

    res.redirect('/?message=Items%20updated%20successfully&type=success');
});

// Route to delete a single item
app.post('/delete/:id', (req, res) => {
    const id = req.params.id;

    dbUtils.deleteOne('items', id, (err, result) => {
        if (err) {
            console.error('Error deleting item ID:', id, err);
            return res.redirect('/?message=Error%20deleting%20item&type=danger');
        }
        res.redirect('/?message=Item%20deleted%20successfully&type=success');
    });
});

// Route to delete multiple items
app.post('/delete-multiple', (req, res) => {
    const ids = req.body['id[]'];

    if (!ids || !Array.isArray(ids)) {
        return res.redirect('/?message=Invalid%20data%20received%20for%20deleting%20multiple%20items&type=danger');
    }

    const condition = 'id IN (?)';

    dbUtils.deleteMany('items', condition, [ids], (err, result) => {
        if (err) {
            console.error('Error deleting multiple items:', err);
            return res.redirect('/?message=Error%20deleting%20multiple%20items&type=danger');
        }
        res.redirect('/?message=Multiple%20items%20deleted%20successfully&type=success');
    });
});

// Route to render form for transferring data
app.get('/transfer', (req, res) => {
    dbUtils.selectAll('items', (err, results) => {
        if (err) {
            console.error('Error fetching items for transfer:', err);
            return res.status(500).send('Error fetching items for transfer');
        }
        res.render('transfer', { items: results });
    });
});

// Route to handle transferring data
app.post('/transfer', (req, res) => {
    const ids = req.body['id[]'];

    if (!ids || !Array.isArray(ids)) {
        return res.redirect('/?message=Invalid%20data%20received%20for%20transferring%20items&type=danger');
    }

    // Define your target table for the transfer
    const targetTable = 'archived_items';

    // Fetch the selected items to transfer
    dbUtils.selectByIds('items', ids, (err, items) => {
        if (err) {
            console.error('Error fetching items for transfer:', err);
            return res.redirect('/?message=Error%20fetching%20items%20for%20transfer&type=danger');
        }

        // Insert the items into the target table
        dbUtils.insertMany(targetTable, items, (err, result) => {
            if (err) {
                console.error('Error inserting items into target table:', err);
                return res.redirect('/?message=Error%20inserting%20items%20into%20target%20table&type=danger');
            }

            // Delete the transferred items from the original table
            const condition = 'id IN (?)';
            dbUtils.deleteMany('items', condition, [ids], (err, result) => {
                if (err) {
                    console.error('Error deleting transferred items:', err);
                    return res.redirect('/?message=Error%20deleting%20transferred%20items&type=danger');
                }
                res.redirect('/?message=Items%20transferred%20successfully&type=success');
            });
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
