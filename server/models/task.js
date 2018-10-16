var mongoose = require('mongoose');

var TaskSchema = mongoose.Schema({

    user_id        : mongoose.Schema.Types.ObjectId,
    date_created   : Date,
    title          : String,
    marked_done    : Boolean,
    tags           : [mongoose.Schema.Types.ObjectId] 
    
});


var Task = module.exports = mongoose.model('Task', TaskSchema);


module.exports.createTask = function(newTask, callback){
  newTask.save(callback);
}
module.exports.deleteTask = function(taskId, callback){
  Task.findByIdAndRemove(taskId, callback);
}

module.exports.toggleDone = function(taskId, callback){

  Task.findById(taskId, function(err, doc){
    if(err){
      callback(err);
    }
    var markedValue = doc.marked_done;
    Task.findByIdAndUpdate(taskId, {marked_done: !markedValue}, callback);
  });
 
}

module.exports.getUserTasks = function(userId, callback){
  var query = {'user_id': userId}; 
  Task.find(query, callback);
}

