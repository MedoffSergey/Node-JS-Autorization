  //Подключение модулей
  const express = require('express');
  const fs = require('fs');
  const path = require('path');
  const pug = require('pug');
  const url = require('url');
  const removeFs = require('fs-extra');
  const cors = require('cors');
  const bodyParser = require('body-parser');

  //init app
  const app = express();

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug'); // указываем используемый шаблонизатор HTML кода

  app.use(bodyParser.urlencoded({ extended: false }))
  // parse application/json
  app.use(bodyParser.json())


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



app.get('/', function(req, res) { //Главная страница
  const files = fs.readdirSync(directory); //Прочитываем файлы из текущей директории

  for (let i = 0; i < files.length; i++) //убираем расширение
  {
    let name = path.basename(files[i], '.conf');
    files[i] = name;
  }

  let searchResult = req.query.search; //присваиваем переменной результат запроса клиента

  const filterItems = (searchResult) => { //фильтр Поискового окна
    return files.filter((el) =>
      el.indexOf(searchResult) > -1
    );
  }

  let filterList = filterItems(searchResult); //присваиваем отфильтрованные переменные в одну переменную

  if (filterList != '') {
    res.render('index', { title: 'Directory', value: filterList });
  } else
    res.render('index', { title: 'Directory', value: files }); //рендерим файл index.pug
});



app.get('/delete', function(req, res) { //  удаления файла из текущей директории
  const files = directory + req.query.id + '.conf';

  removeFs.remove(files, err => {   //воспользуемся модулем fs-extra для удаления файла
    if (err) console.error(err),
      res.send("Файл " + req.query.id + " был успешно удален");
  })
});



app.get('/add', function(req, res) { //добавление
  let domain = req.query.domain;
  let fileName = directory + domain + '.conf'
  let ip = req.query.ip;

  let domenWithoutDots = domain.replace(/\./g, "");   //убираем точку глабально используя регулярные выражения

  let fileContent = fs.readFileSync('/home/smedov/Work/Test/template.conf', "utf8");  //считываем то что находиться в файле
  var newStr = fileContent.replace(/__DOMAINWITHOUTDOT__/g, domenWithoutDots).replace(/__DOMAIN__/g, domain).replace(/__IP_ADDRESS__/g, ip);  //заменяем контекст в файле

  //записываем в файл домен и ip
  fs.writeFile(fileName, newStr, function(error) {
    if (error) throw error; //Использую инструкцию throw для генерирования исключения
    res.send("200 OK"); //выведем 200ок

  });
});

app.get('/login', function(req, res) { //авторизация
  res.render('login', {
    title: 'Вход'
  });
});



function check(userLogin) {
  for (let i = 0; i < userList.length; i++) {
    if (userList[i].login === userLogin) {
      return userList[i];
    }
  }
  return false;
}



app.get('/getLogin', function(req, res) { //авторизация
  let login = req.query.login
  let password = req.query.password
  const uniqueUser = check(login)

  if (password === uniqueUser.password) {
    const out = {
      status: 1,
      token: 'supertoken-3213123123',
      str: req.query.login + '--' + req.query.password,
      name: req.query.login,
      user: uniqueUser.id
    }
    res.json(out) //отправляю json формат на клиент
  } else {
    res.json({
      status: 0
    })
  }
});



app.get('/admin', function(req, res) {
  let result = req.query.sort
  let sortMethod = req.query.direction

  sortTable(result, userList, sortMethod)
  res.render('admin', { title: 'Админка', userList: userList });
});



function sortTable(index, array, method) {
  if (method == "down") {
    array.sort(function(a, b) {
      if (a[index] > b[index]) return 1;
      else if (a[index] < b[index]) return -1;
      else return 0;
    })
  } else {
    array.sort(function(a, b) {
      if (a[index] < b[index]) return 1;
      else if (a[index] > b[index]) return -1;
      else return 0;
    })
  }
}



app.get('/ajax/admin/addNewUser', function(req, res) { //авторизация под админа
  let newUserLogin = req.query.login;
  let newUserName = req.query.name;
  let newUserPassword = req.query.password;

  let user = {
    id: userList.length + 1,
    login: newUserLogin,
    name: newUserName,
    password: newUserPassword,
  }

  userList.push(user)

  res.send("200 OK");
});



function authenticationLogin(userList, login) {
  for (let i = 0; i < userList.length; i++) {
    if (userList[i].login === login) {
      return userList[i].id
    }
  }
  return false
}

app.get('/ajax/admin/removeUser', function(req, res) { //авторизация под админа
  let removeUserLogin = req.query.login;
  let removeResult = authenticationLogin(userList, removeUserLogin)

  userList.splice(removeResult - 1, 1);
  res.send("200 OK");
});



app.get('/ajax/users', function(req, res) {
  res.json(userList) //рендерим массив пользователей
});



function authenticationId(userList, id) {
  for (let i = 0; i < userList.length; i++) {
    if (userList[i].id == id) {
      return userList[i]
    }
  }
  return false
}

app.get('/ajax/users/delete', function(req, res) {
  let uniqueUserId = Number(req.query.id) //Id пользователя
  let resultRemoveUser = authenticationId(userList, uniqueUserId) //функция аунтификации по id

  if (Boolean(resultRemoveUser)) {
    let userIndexReal = userList.indexOf(resultRemoveUser);
    userList.splice(userIndexReal, 1);
    res.json(userList)
  } else {
    console.log("Нет такого пользователя!")

    res.json(userList);
  }
});



function LoginVerification(userList, login) {
  for (let i = 0; i < userList.length; i++) {
    if (userList[i].login === login) {
      return userList[i]
    }
  }
  return false
}

app.post('/ajax/users/add', function(req, res) {
  console.log(req.body);

  let userName = req.body.name; //name пользователя
  let userLogin = req.body.login; //name пользователя
  let userPassword = req.body.password; //name пользователя

  let user = {
    id: ++lengthArray,
    name: userName,
    login: userLogin,
    password: userPassword
  }

  if (LoginVerification(userList,userLogin) == false && userName!='' && userLogin!='' && userPassword!=''){
    userList.push(user)
    res.json(userList);
  }
  else {
    console.log("Такой пользователь уже существует")
    --lengthArray;
  }
});


//запускаем сервер
app.listen(3000, function() {
  console.log('Отслеживаем порт: 3000!');
});
