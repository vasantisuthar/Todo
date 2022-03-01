const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/listDB', { useFindAndModify: false },{ useUnifiedTopology: true } );

const itemSchema = new mongoose.Schema({
    item : String
});

const listSchema = new mongoose.Schema({
    name : String,
    list : [itemSchema]
});

const folderSchema = new mongoose.Schema({
    newList : String
});
const Folder = mongoose.model("Folder",folderSchema);
const List = mongoose.model("List", listSchema);
const Item = mongoose.model("Item", itemSchema);

app.get('/',(req, res) => {
    Item.find({}, (err, foundItems) => {
        Folder.find({},(err, foundLists) =>{
            res.render('list',{items: foundItems, lists: foundLists, listTitle : 'Today'});
        })
    })
});

app.post('/',(req, res) => {
    const item1 = new Item({
        item : req.body.newItem
    });

    const listName = req.body.item;
    if (listName === "Today"){
        item1.save();
        res.redirect("/");
    }else{
        List.findOne({name : listName},(err, foundList) => {
            if(!err){
                if(foundList){
                    foundList.list.push(item1);
                    foundList.save();
                    res.redirect("/" + listName);
                }
            }
        });
    }
});

app.post('/list',(req, res) =>{
    const folder1 = new Folder({
        newList : req.body.newList,
    });
    folder1.save();
    res.redirect('/' + folder1.newList);
});
app.get('/:customList',(req, res) =>{
    const customList = req.params.customList;
    List.findOne({name : customList},(err, foundLists) => {
        Folder.find({}, (err, foundFolder) => {
            if(!err){
                if(!foundLists){
                    const list2 = new List({
                        name : customList,
                        list : [itemSchema]
                    });
                    list2.save();
                    res.redirect("/" + customList);
                }else{
                    res.render('list', {listTitle : foundLists.name, lists: foundFolder, items : foundLists.list});
                }
            }
        })
    })
});

app.post('/delete',(req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err){
            if (!err) {
            console.log("Successfully deleted checked item.");
            res.redirect("/");
            }
        });
        } else {
        List.findOneAndUpdate({name: listName}, {$pull: {list: {_id: checkedItemId}}}, function(err, foundList){
            if (!err){
                res.redirect("/" + listName);
            }
        });
    }
    
})

app.post('/deleteList',(req, res) => {
    const listId = req.body.deletedList;
    console.log(listId)
    Folder.findByIdAndDelete({_id:listId},(err, done) => {
        console.log(done)
        if(done){
            res.redirect('/');
        }else{
            console.log(err);
        }
    })
})



app.listen(3000, () => {
    console.log("server at port 3000");
});