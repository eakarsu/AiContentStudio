'use strict';
require('dotenv').config({path:require('path').resolve(__dirname,'../../.env')});const {spawnSync}=require('child_process');const cli=require.resolve('prisma/build/index.js');const result=spawnSync(process.execPath,[cli,'migrate','deploy'],{cwd:require('path').resolve(__dirname,'..'),stdio:'inherit',env:process.env});if(result.error)throw result.error;process.exit(result.status??1);
