import AppDispatcher from '../dispatchers/AppDispatcher.js';

export default {

  loginUser: (jwt) => {

    AppDispatcher.dispatch({
      type: 'LOGIN_USER',
      jwt: jwt 
    });

  },


  logoutUser: () => {
    
    AppDispatcher.dispatch({
      type: 'LOGOUT_USER',
    });

  }
}
