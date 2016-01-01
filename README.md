#uk-72-api

Running with serverless 0.0.15

```npm install -g serverless```

Running function locally
```serverless function run```


To create a new module and function

```
    serverless module create
```
Follow the command prompts, ie create a module called power with a function called warnings
Do some tweaking of s-function.json (ie rename the label on AWS, and decreate the required amount of memory, maybe increase timeout
```
    cd power
    serverless function deploy
    serverless endpoint deploy
```

Other commands see
http://docs.serverless.com/docs/commands-overview


