import('./src')
  .then(({ default: init }) => init())
  .then(() => console.log('App loaded and started successfully...'))
  .catch(console.error);
