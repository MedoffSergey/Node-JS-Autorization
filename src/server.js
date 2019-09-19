  //Подключение модулей
  const express = require('express');         // подключаем express
  const fs = require('fs');
  const removeFs = require('fs-extra');
  const path = require('path');               //модуль path позволяет указывать пути к дирректориям
  const pug = require('pug');                 // подключаем модуль шаблонизатора
  const cors = require('cors');               //модуль для
  const bodyParser = require('body-parser');
  const createError = require('http-errors')  // модуль отлавливания ошибок
  const jwt = require('jsonwebtoken');

  const app = express(); //init app

  app.set('views', path.join(__dirname, 'views')); //указываем путь к pug файлам
  app.set('view engine', 'pug');                  // указываем используемый шаблонизатор HTML кода

  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())

  app.use(cors());

  app.use(express.static(path.join(__dirname, 'public'))); //добовляет файлы которые на компьютере для загрузки если они имеются

  const MY_SECRET = "cAtwa1kkEy"      // случайный секретный ключ
  const directory = '/home/smedov/Work/Test/'; //Указываем путь текущей дериктории

  let userList = [                    // массив пользователей
      { id: 1, name: 'Admin', login: 'Admin', password:"qwe"},
      { id: 2, name: 'Igor', login: 'Amstel', password:"123"},
      { id: 3, name: 'Serega', login: 'MRG_Serejka', password:"12345"},
      { id: 4, name: 'Artur', login: 'Archi', password:"qwerty"},
      { id: 5, name: 'Elsa', login: 'Els@', password:"AdG4Q1q7"},
      { id: 6, name: 'Sanek', login: 'MRG_Sanek', password:"Sanekkk"},
      { id: 7, name: 'Serega', login: 'GREY', password:"3145Wqq1"},
      { id: 8, name: 'Irina', login: 'Beller', password:"qwerty"}
  ];

  let filesList = []

  let lengthArray = userList.length   // переменная хранящая длинну массива

    // ФУНКЦИИ Вспомогательные__________________________________________________

    function searchById(userList, id) {
      for (let i = 0; i < userList.length; i++) {
        if (userList[i].id == id) {
          return userList[i]
        }
      }
      return false
    };

    function loginСomparison(userList, login) {
      for (let i = 0; i < userList.length; i++) {
        if (userList[i].login === login) {
          return userList[i]
        }
      }
      return false
    };



//ФУНКЦИИ КОТОРЫМ НЕ НУЖЕН ТОКЕН ДЛЯ ВЫПОЛНЕНИЯ_________________________________
app.post('/ajax/users/dataChecking', function(req, res, next) {
  let userLogin = req.body.login; //name пользователя
  let userPassword = req.body.password; //password пользователя
  let checkUser = loginСomparison(userList, userLogin) //проверим есть ли такой пользоваль

  if (checkUser && checkUser.password === userPassword) {
    let user = loginСomparison(userList, userLogin) //получаем Объект пользователя
    let token = jwt.sign({ id: user.id, login: user.login }, MY_SECRET); //хешируем токен используя секретный ключ

    res.json({ //отправим ответ на сервер JSON
      token: token, // захешированный токен
      id: user.id,
      name: user.name,
      login: user.login
    })
  } else {
    return next(createError(400, 'Вы ввели неправильные логин или пароль'))
  }
})

//ОБРАБОТЧИК ПЕРЕХВАТЫВАЕТ ВСЕ ПУТИ_____________________________________________

app.use('*', function(req, res, next) {
  let token
  let result = (req.headers.authorization)
  if(result) token = result.substr(7)
  // console.log(token)

  if (!token) { // приводим к булевному значению (то что токена не существует)
    return next(createError(412, 'Токен не сушествует'))
  }
  let decoded = jwt.verify(token, MY_SECRET); // расшифруем токен
  if (!decoded) {
    return next(createError(416, 'Токен не валиден'))
  } else next()
})

//ФУНКЦИИ ДЛЯ КОТОРЫХ НУЖЕН ТОКЕН_______________________________________________

app.get('/ajax/users', function(req, res,next) {
  res.json(userList) // рендерим массив пользователей
});


app.post('/ajax/users/deleteUser', function(req, res,next) {    // удаление пользователей на стороне клиента
  let uniqueUserId = Number(req.body.id) // Id пользователя
  let resultRemoveUser = searchById(userList, uniqueUserId) // функция аунтификации по id

  if (resultRemoveUser) {
    let userIndexReal = userList.indexOf(resultRemoveUser);
    userList.splice(userIndexReal, 1);
    res.json(userList)
  } else {
    return next(createError(400, 'Данного пользователя не cуществует'))
  }
})



app.post('/ajax/users/addUser', function(req, res, next) {
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
    res.json({
      userList
    });
  }
  else {
    return next(createError(400, 'Логин уже сушествует'))
  }
});

app.get('/ajax/users/giveUser',function(req, res, next) {
  let token
  let result = (req.headers.authorization)
  if(result) token = result.substr(7)
  let decoded = jwt.verify(token, MY_SECRET)
  userId = (decoded.id)
  let currentUser = searchById(userList, userId)// получаем юзера по ид

  res.json({
    currentUser // отправим юзера на сервер
  })
})

app.get('/ajax/users/fileTable', function(req, res) {
  let files = fs.readdirSync(directory); //Прочитываем файлы из текущей директории
  let ipArr = []
  let domainArr = []
  let domenIpObj = []


  for (let i = 0; i < files.length; i++) //убираем расширение
  {
    let str = (fs.readFileSync(directory + files[i], 'utf8'));

    regexp = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}.[0-9]{1,3}/g
    let ip = str.match(regexp) || ['###IP Не указан###']

    ipArr.push(ip[0])

    let domain = path.basename(files[i], '.conf');
    domainArr.push(domain)



    domenIpObj[i] = {
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
  console.log(ip)
  let domenWithoutDots = domain.replace(/\./g, "");   //убираем точку глабально используя регулярные выражения

  let fileContent = fs.readFileSync('/home/smedov/Work/Test/template.conf', "utf8");  //считываем то что находиться в файле
  var newStr = fileContent.replace(/__DOMAINWITHOUTDOT__/g, domenWithoutDots).replace(/__DOMAIN__/g, domain).replace(/__IP_ADDRESS__/g, ip);  //заменяем контекст в файле

  //записываем в файл домен и ip
  fs.writeFile(fileName, newStr, function(error) {
    if (error) throw error; //Использую инструкцию throw для генерирования исключения
  })
  res.json({
    success : 1
  })
});

app.post('/ajax/users/deleteFiles', function(req, res) { //  удаления файла из текущей директории
  const files = directory + req.body.files + '.conf';
  removeFs.remove(files, err => {   //воспользуемся модулем fs-extra для удаления файла
    if (err) console.error(err)
   })
   res.json({
     files
   })
});

//_______________ПОИСК________________________________________
app.post('/ajax/users/tableUserSearch', function(req, res) { //  удаления файла из текущей директории
     let newSearchList=[]
     let searchResult = req.body.filterInput.toLowerCase();

     newSearchList = userList.filter(function(elem) {
       if (
           elem.login.toLowerCase().indexOf(searchResult) != -1 ||
           elem.name.toLowerCase().indexOf(searchResult) != -1  ||
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
  console.log(newSearchList)

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
