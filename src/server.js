  //Подключение модулей
  const express = require('express');
  const fs = require('fs');
  const path = require('path');
  const pug = require('pug');
  const url = require('url');
  const removeFs = require('fs-extra');
  const cors = require('cors');
  const bodyParser = require('body-parser');
  const createError = require('http-errors')
  const jwt = require('jsonwebtoken');
  //init app
  const app = express();

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug'); // указываем используемый шаблонизатор HTML кода

  app.use(bodyParser.urlencoded({ extended: false }))
  // parse application/json
  app.use(bodyParser.json())

  const MY_SECRET = "cAtwa1kkEy"


  const directory = '/home/smedov/Work/Test/'; //Указываем путь текущей дериктории

  let userList = [
      { id: 1, name: 'Admin', login: 'Admin', password:"qwe"},
      { id: 2, name: 'Igor', login: 'Amstel', password:"123"},
      { id: 3, name: 'Serega', login: 'MRG_Serejka', password:"12345"},
      { id: 4, name: 'Artur', login: 'Archi', password:"qwerty"},
      { id: 5, name: 'Elsa', login: 'Els@', password:"AdG4Q1q7"},
      { id: 6, name: 'Sanek', login: 'MRG_Sanek', password:"Sanekkk"},
      { id: 7, name: 'Serega', login: 'GREY', password:"3145Wqq1"},
      { id: 8, name: 'Irina', login: 'Beller', password:"qwerty"}
  ];

  let lengthArray = userList.length // переменная хранящая длинну массива

app.use(express.static(path.join(__dirname, 'public'))); //добовляет файлы которые на компьютере для загрузки если они имеются
app.use(cors());


    // ФУНКЦИИ Вспомогательные


    function searchById (userList, id) {
      for (let i = 0; i < userList.length; i++) {
        if (userList[i].id == id) {
          return userList[i]
        }
      }
      return false
    };


    function loginСomparison (userList, login) {
      for (let i = 0; i < userList.length; i++) {
        if (userList[i].login === login) {
          return userList[i]
        }
      }
      return false
    };

    function passwordСheck (userList, password) {
      for (let i = 0; i < userList.length; i++) {
        if (userList[i].password === password) {
          return userList[i]
        }
      }
      return false
    };

    function sortTable(index, array, method) { // Cортировка пользователей по колонкам
      return userList.slice().sort(function(a, b) {
      let modifier = -1
      if (method == "up") modifier = 1
        array.sort(function(a, b) {
          if (a[index] > b[index]) return 1*modifier;
          else if (a[index] < b[index]) return -1*modifier;
          else return 0;
        })
        })
    }




app.get('/ajax/users', function(req, res) {
  res.json(userList) // рендерим массив пользователей
});


app.post('/ajax/users/delete', function(req, res,next) {    // удаление пользователей на стороне клиента
  let uniqueUserId = Number(req.body.id) // Id пользователя
  let resultRemoveUser = searchById(userList, uniqueUserId) // функция аунтификации по id


  if (Boolean(resultRemoveUser)) {
    let userIndexReal = userList.indexOf(resultRemoveUser);
    userList.splice(userIndexReal, 1);
    res.json(userList)
  } else {
    console.log('Данного пользователя не cуществует')
  }
})



app.post('/ajax/users/add', function(req, res, next) {

  let userName = req.body.name; //name пользователя
  let userLogin = req.body.login; //login пользователя
  let userPassword = req.body.password; //password пользователя

  // ??????????????????????????????????????????
  let user = {
    id: ++lengthArray,
    name: userName,
    login: userLogin,
    password: userPassword
  }

  if (loginСomparison(userList,userLogin) == false && userName!='' && userLogin!='' && userPassword!=''){
    userList.push(user)
    res.json(userList);
  }
  else {
    --lengthArray;
    return next(createError(400, 'Пользователя не существует'))
  }
});

app.post('/ajax/users/dataChecking', function(req, res,next) {
      let userLogin = req.body.login; //name пользователя
      let userPassword = req.body.password; //name пользователя

      if (loginСomparison(userList, userLogin) && passwordСheck(userList, userPassword)) {
        let user = loginСomparison(userList, userLogin)
        var token = jwt.sign({ name: user.id, login: user.login }, MY_SECRET);

        res.json({
          token:token,
          userId: user.id,
          userName: user.name,
          userLogin: user.login

        })
      }
    
    })



    //ОТЛАВЛИВАЕМ ОШИБКИ ЗДЕСЬ
    //Используется модуль http-errors

app.use(function(req, res, next) {
  return next(createError(404, 'Api метод не существует'))
})

app.use(function(err, req, res, next) {
  res.status(err.statusCode)
  res.json({
    success: 0,
    error: err,
    message: err.message
  })
})


//запускаем сервер
app.listen(3000, function() {
  console.log('Отслеживаем порт: 3000!');
});
