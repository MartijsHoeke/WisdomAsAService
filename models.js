'use strict';

exports = module.exports = function(app, mongoose) {
  //embeddable docs first
  require('./schema/Note')(app, mongoose);
  require('./schema/Status')(app, mongoose);
  require('./schema/StatusLog')(app, mongoose);
  require('./schema/Category')(app, mongoose);

  //then regular docs
  require('./schema/User')(app, mongoose);
  require('./schema/Event')(app, mongoose);
  require('./schema/BusinessRules')(app, mongoose);
  require('./schema/GoogleSearchResults')(app, mongoose);
  require('./schema/ScrapeStrategy')(app, mongoose);
  require('./schema/ScrapeResults')(app, mongoose);
  require('./schema/Companies')(app, mongoose);
  require('./schema/Testdata')(app, mongoose);
  require('./schema/Admin')(app, mongoose);
  require('./schema/AdminGroup')(app, mongoose);
  require('./schema/Account')(app, mongoose);
  require('./schema/LoginAttempt')(app, mongoose);
};
