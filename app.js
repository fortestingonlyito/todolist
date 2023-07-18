//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { escapeXML } = require("ejs");
const e = require("express");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();
// local connection
// mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true});

// mongoDB atlas online connection
mongoose.connect("mongodb+srv://admin-pambili:Test123@cluster0.ybhbjwk.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your to do list!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.>"
});

const defaultItems = [item1, item2, item3];

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", function(req, res) {
  // const day = date.getDate();
  // finding data in the collection
  let items;

  let findItems = async function() {
    try {
      items = await Item.find();

      if (items.length == 0) {
        let insertItem = async function() {
          try {
            let x = await Item.insertMany(defaultItems);
          } catch (err) {
            console.log(err);
          }
        };
        insertItem();
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: items});
      }
      // mongoose.connection.close();
    } catch (error) {
      console.log(error);
    }
  };

  findItems(); // calls the function to get the list of items
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const addedItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    addedItem.save();
    res.redirect("/");
  } else {
    let findUrl = async function() {
      try {
        let response = await List.findOne({name: listName});
        response.items.push(addedItem)
        response.save();
        res.redirect("/" + listName);
      } catch (error) {
        console.log(error);
      }
    };
    findUrl(); // calls the function to check if the url exists
  } 
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    let delItem = async function() {
      try {
        let response = await Item.deleteOne({_id: checkedItemId});
        res.redirect("/");
      } catch (error) {
        console.log(error);
      }
    };
    delItem();

  } else {
    let delItem = async function() {
      try {
        let response = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
        res.redirect("/" + listName);
      } catch (error) {
        console.log(error);
      }
    };
    delItem();
  }  
});

app.get("/:todoIndex", function(req, res) {
  const todo = _.capitalize(req.params.todoIndex);
  
  let findUrl = async function() {
    try {
      let response = await List.findOne({name: todo});
      if (response) {
        // Show the existing list
        res.render("list", {listTitle: response.name, newListItems: response.items})
      } else {
        // Create a new list
        const list = new List({
        name: todo,
        items: defaultItems
        });
        list.save();
        res.redirect("/" + todo)
      }
    } catch (error) {
      console.log(error);
    }
  };
  findUrl(); // calls the function to check if the url exists
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
