  //Подключение модулей
  const express = require('express'); // подключаем express
  const fs = require('fs');
  const removeFs = require('fs-extra');
  const path = require('path'); //модуль path позволяет указывать пути к дирректориям
  const pug = require('pug'); // подключаем модуль шаблонизатора
  const cors = require('cors'); //модуль для axios
  const bodyParser = require('body-parser');
  const createError = require('http-errors') // модуль отлавливания ошибок
  const jwt = require('jsonwebtoken');  //модуль шифрования
  const bcrypt = require('bcrypt');//модуль для соли
  const { SHA3 } = require('sha3');//модуль хеширования SHA3
  const app = express(); //init app
  const mysql = require('mysql2');
  const cfg   = require( './dbConfig' );
  const dbClass = require ('./db.js')
  const async = require("async");

  app.set('views', path.join(__dirname, 'views')); //указываем путь к pug файлам
  app.set('view engine', 'pug'); // указываем используемый шаблонизатор HTML кода

  app.use(bodyParser.urlencoded({
    extended: false
  }))
  app.use(bodyParser.json())

  app.use(cors());

  app.use(express.static(path.join(__dirname, 'public'))); //добовляет файлы которые на компьютере для загрузки если они имеются

  const MY_SECRET = "cAtwa1kkEy" // случайный секретный ключ
  const directory = '/home/smedov/Work/Test/'; //Указываем путь текущей дериктории

    // ФУНКЦИИ Вспомогательные__________________________________________________
    function user() {
      const db = new dbClass()
      return db.query('SELECT * FROM userList', [])
    }

    function addNewUser(newUserArr) {
      const db = new dbClass()
      return db.query("INSERT INTO userList (status,name, login, password,salt) VALUES (?, ?, ?, ?, ?)", [newUserArr.status, newUserArr.name, newUserArr.login, newUserArr.password, newUserArr.salt])
    }

    function deleteUser(uniqueUserId) {
      const db = new dbClass()
      return db.query("DELETE FROM userList where id = ? ", [uniqueUserId])
    }

    function userLoginAuth(userLogin) {
      const db = new dbClass()
      return db.query("SELECT * FROM userList WHERE login = ? ", [userLogin])
        .then(user => {
          if(user.length>0) return user[0]
          return null
        })
    }

    function changePasswordUser(id, hash, salt) {
      const db = new dbClass()
      return db.query("UPDATE userList SET password=?,salt=? WHERE id=? ", [hash, salt, id])
      .then(user => {
        if(user.length>0) return user[0]
        return null
      })
    };


    function searchById(id) {
      const db = new dbClass()
      return db.query("SELECT * FROM userList WHERE id = ? ", [id])
      .then(user => {
        if(user.length>0) return user[0]
        return null
      })
    };


    function hashUser(userPassword, salt) {
      const hash = new SHA3(256);
      hash.update(userPassword + salt);
      let hashUserPsw = hash.digest('hex');
      return hashUserPsw;
    }
    //ФУНКЦИИ КОТОРЫМ НЕ НУЖЕН ТОКЕН ДЛЯ ВЫПОЛНЕНИЯ_________________________________
    app.post('/ajax/users/dataChecking', function(req, res, next) {
      let userLogin = req.body.login; //name пользователя
      let userPassword = req.body.password; //password пользователя

      userLoginAuth(userLogin).then(user => {
        if (user) {
          let checkUser = user //проверим есть ли такой пользоваль
          let salt = checkUser.salt
          let result = hashUser(userPassword, salt)

          if (checkUser && checkUser.password === result) {
            let token = jwt.sign({
              id: user.id,
              login: user.login
            }, MY_SECRET); //хешируем токен используя секретный ключ

            res.json({
              token: token, // захешированный токен
              id: user.id,
              name: user.name,
              login: user.login,
              status: user.status
            })
          } else {
            return next(createError(402, 'Вы ввели неправильные логин или пароль'))
          }

        } else {
          return next(createError(402, 'Вы ввели неправильные логин или пароль'))
        }
      })
    })
//ОБРАБОТЧИК ПЕРЕХВАТЫВАЕТ ВСЕ ПУТИ_____________________________________________

app.use('*', function(req, res, next) {
  let token
  let result = (req.headers.authorization)
  if (result) token = result.substr(7) //вырежем слово baerer

  if (!token) { // приводим к булевному значению (если токена не существует)
    return next(createError(412, 'Токен не сушествует'))
  }

  let decoded = jwt.verify(token, MY_SECRET); // расшифруем токен
  if (!decoded) {
    return next(createError(416, 'Токен не валиден'))
  } else next()
})
//ФУНКЦИИ ДЛЯ КОТОРЫХ НУЖЕН ТОКЕН_______________________________________________
//_________USER___________________

app.get('/ajax/users', function(req, res, next) {
  user().then(userList => {
    res.json(userList) // рендерим массив пользователей
  })
});


app.post('/ajax/users/deleteUser', function(req, res, next) { // удаление пользователей на стороне клиента
  let uniqueUserId = Number(req.body.id) // Id пользователя преобразованный как числовой тип данных

  deleteUser(uniqueUserId).then(() => {
    res.json({
      succes: 1
    })
  })
})


app.post('/ajax/users/addUser', function(req, res, next) {
  let userName = req.body.name; //name пользователя
  let userLogin = req.body.login; //login пользователя
  let userPassword = req.body.password; //password пользователя
  let status = req.body.status
  if (status) { status = "Admin"}
  else {status = "User" }

  let salt = bcrypt.genSaltSync(10);
  let result = hashUser(userPassword, salt)

  if (userName != '' && userLogin != '' && userPassword != '') {
    const newUserArr = {
      status: status,
      name: userName,
      login: userLogin,
      password: result,
      salt: salt
    }
    addNewUser(newUserArr).then(currentUser => {
      res.json({
        currentUser
      });
    })
    .catch((error)=> {
        next(error)
      });
  } else {
    return next(createError(400, 'Вы не заполнили в полях данные'))
  }

});

app.get('/ajax/users/giveUser', function(req, res, next) {

  let token
  let result = (req.headers.authorization)
  if (result) token = result.substr(7)
  let decoded = jwt.verify(token, MY_SECRET)
  userId = (decoded.id)
  searchById(userId).then(currentUser => { // получаем юзера по ид
    res.json({
      currentUser
    })
  })
})

app.post('/ajax/users/changePassword', function(req, res, next) {
  let userId = req.body.userId
  let firstInput = req.body.newPass.firstInput
  let secondInput = req.body.newPass.secondInput

  searchById(userId).then(currentUser => {
    if (firstInput === secondInput && firstInput != '' && secondInput != '') {
      let salt = bcrypt.genSaltSync(10);
      let hashResult = hashUser(currentUser.password, salt)
      changePasswordUser(userId, hashResult, salt)
    }
    res.json({
      success: 1
    })
  })
})
//______________FILES________________

app.get('/ajax/users/fileTable', function(req, res) {
  let files = fs.readdirSync(directory); //Прочитываем файлы из текущей директории
  let ipArr = []
  let domainArr = []
  let domenIpObj = [] // массив для хранения обьектов

  for (let i = 0; i < files.length; i++) //убираем расширение
  {
    let str = (fs.readFileSync(directory + files[i], 'utf8'));
    regexp = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}.[0-9]{1,3}/g
    let ip = str.match(regexp) || ['###IP Не указан###']

    ipArr.push(ip[0])

    let domain = path.basename(files[i], '.conf');
    domainArr.push(domain)

    domenIpObj[i] = { // заполним обьект
      ip: ipArr[i],
      domain: domainArr[i]
    }
  }
  filesList = domenIpObj
  res.json({
    domenIpObj
  })
})

app.post('/ajax/users/addFiles', function(req, res) { //добавление
  let domain = req.body.domain;
  let fileName = directory + domain + '.conf'
  let ip = req.body.ip;

  let domenWithoutDots = domain.replace(/\./g, ""); //убираем точку глабально используя регулярные выражения

  let fileContent = fs.readFileSync('/home/smedov/Work/Test/template.conf', "utf8"); //считываем то что находиться в файле
  var newStr = fileContent.replace(/__DOMAINWITHOUTDOT__/g, domenWithoutDots).replace(/__DOMAIN__/g, domain).replace(/__IP_ADDRESS__/g, ip); //заменяем контекст в файле

  //записываем в файл домен и ip
  fs.writeFile(fileName, newStr, function(error) {
    if (error) throw error; //Использую инструкцию throw для генерирования исключения
  })
  res.json({
    success: 1
  })
});

app.post('/ajax/users/deleteFiles', function(req, res) { //  удаления файла из текущей директории
  const files = directory + req.body.files + '.conf';
  removeFs.remove(files, err => { //воспользуемся модулем fs-extra для удаления файла
    if (err) console.error(err)
  })
  res.json({
    success: 1
  })
});


app.post('/ajax/users/directoryContent', function(req, res) { //  удаления файла из текущей директории
   let directory = req.body.directory; //name пользователя
   fs.readdir(directory, function(err, items) {
   for (var i=0; i<items.length; i++) {
       console.log(items[i]);
   }
 });
   console.log('fileContent',fileContent)
 res.json({
   success: 1
 })
});

//_______________FILTER________________________________________

app.post('/ajax/users/tableUserSearch', function(req, res) { //  удаления файла из текущей директории
  let newSearchList = []
  let searchResult = req.body.filterInput.toLowerCase();

  user().then(userList => {
    newSearchList = userList.filter(function(elem) {
      if (
        elem.login.toLowerCase().indexOf(searchResult) != -1 ||
        elem.name.toLowerCase().indexOf(searchResult) != -1 ||
        String(elem.id).toLowerCase().indexOf(searchResult) != -1
      ) {
        return true;
      } else {
        return false;
      }
    });
    console.log(newSearchList)
    res.json({
      newSearchList
    })
  })
});

app.post('/ajax/users/tableFilesSearch', function(req, res) { //  удаления файла из текущей директории
  let newSearchList = []
  let searchResult = req.body.filterInput.toLowerCase();

  newSearchList = filesList.filter(function(elem) {
    if (
      elem.domain.toLowerCase().indexOf(searchResult) != -1 ||
      elem.ip.toLowerCase().indexOf(searchResult) != -1
    ) {
      return true;
    } else {
      return false;
    }
  });

  res.json({
    newSearchList
  })
});

//ОТЛАВЛИВАЕМ ОШИБКИ ЗДЕСЬ
//Используется модуль http-errors_______________________________________________

app.use(function(req, res, next) { //ОТЛАВЛИВАЕМ ВСЕ НЕ СУЩЕСТВУЕЩИЕ ПУТИ И ВЫВЕДЕМ СООТВЕТСВУЮЩУЮ ОШИБКУ
  return next(createError(404, 'Api метод не существует'))
})

app.use(function(err, req, res, next) { //ВЫВЕДЕМ В NETWORK ОТФАРМАТИРОВАННОЕ СООЬЩЕНИЕ ОБ ОШИБКЕ
  const code = err.statusCode || 500
  res.status(err.statusCode || 500)

  if(code==500){
    res.json({
      success: 0,
      error: err,
      message: "Произошла ошибка на серевере , попробуйте позже"
    })
  }else{
    res.json({
      success: 0,
      error: err,
      message: err.message
    })
  }
})

//запускаем сервер
app.listen(3000, function() {
  console.log('Отслеживаем порт: 3000!');
});
