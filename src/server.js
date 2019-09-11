  //Подключение модулей
  const express = require('express');
  const path = require('path');
  const pug = require('pug');
  const cors = require('cors'); //модуль для axios
  const bodyParser = require('body-parser');
  const createError = require('http-errors')
  const jwt = require('jsonwebtoken');

  //init app
  const app = express();

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug'); // указываем используемый шаблонизатор HTML кода

  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())
  app.use(cors());
  app.use(express.static(path.join(__dirname, 'public'))); //добовляет файлы которые на компьютере для загрузки если они имеются

  const MY_SECRET = "cAtwa1kkEy"

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
//ФУНКЦИИ КОТОРЫМ НЕ НУЖЕН ТОКЕН ДЛЯ ВЫПОЛНЕНИЯ____________________________________________

    app.post('/ajax/users/dataChecking', function(req, res,next) {
      let userLogin = req.body.login; //name пользователя
      let userPassword = req.body.password; //password пользователя

      if (loginСomparison(userList, userLogin) && passwordСheck(userList, userPassword)) {
        let user = loginСomparison(userList, userLogin) //получаем Объект пользователя
        let token = jwt.sign({ name: user.id, login: user.login }, MY_SECRET); //хещируем токен используя секретный ключ

        res.json({  //отправим ответ на сервер JSON
          token: token, // захешированный токен
          userId: user.id,
          userName: user.name,
          userLogin: user.login
        })
      }else {
        return next(createError(400, 'Вы ввели неправильные логин или пароль'))
      }
    })

//ОБРАБОТЧИК ПЕРЕХВАТЫВАЕТ ВСЕ ПУТИ________________________



app.use('*', function(req, res, next) {

  let token = req.query.token
  if(!token) token = req.body.token


  //
  //let token = req.query.token ?  req.query.token : req.body.token
  //
  //let token = req.query.token || req.body.token
  //





  console.log("token: " ,token)
  if (!token) { // приводим к булевному значению (то что токена не существует)
    return next(createError(412, 'Токен не сушествует'))
  }
  let decoded = jwt.verify(token, MY_SECRET); // расшифруем токен

  if (!decoded) {
    return next(createError(416, 'Токен не валиден'))
  } else next()
})

//ФУНКЦИИ ДЛЯ КОТОРЫХ НУЖЕН ТОКЕН__________________________________________________________________________________

app.get('/ajax/users', function(req, res,next) {
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
    return next(createError(400, 'Данного пользователя не cуществует'))
  }
})



app.post('/ajax/users/add', function(req, res, next) {
  let userName = req.body.name; //name пользователя
  let userLogin = req.body.login; //login пользователя
  let userPassword = req.body.password; //password пользователя

  if (loginСomparison(userList,userLogin) == false && userName!='' && userLogin!='' && userPassword!=''){
    const newUserArr = {
      id: ++lengthArray,
      name: userName,
      login: userLogin,
      password: userPassword,
    }
    userList.push(newUserArr)
    res.json(userList);
  }
  else {
    return next(createError(400, 'Логин уже сушествует'))
  }
});


    //ОТЛАВЛИВАЕМ ОШИБКИ ЗДЕСЬ
    //Используется модуль http-errors

app.use(function(req, res, next) {
  return next(createError(404, 'Api метод не существует'))
})

app.use(function(err, req, res, next) {
/*  console.log(err.statusCode)
  console.log(err)
  console.log(err.__proto__)
  */
  res.status(err.statusCode || 500)
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
