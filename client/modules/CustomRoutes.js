import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import LoginStore from '../stores/LoginStore';
import NotloggedinPage from '../pages/NotloggedinPage'

 

  var renderMergedProps = (component, ...rest) => {
    const finalProps = Object.assign({}, ...rest);
    return (
      React.createElement(component, finalProps)
    );
  }


  var PropsRoute = ({ component, ...rest }) => {
    return (
      <Route {...rest} render={routeProps => {
        return renderMergedProps(component, routeProps, rest);
      }}/>
    );
  }



  var PrivateRoute = ({ history, component, redirectTo, ...rest }) => {
    
    if(LoginStore.isLoggedIn()){
      return <Route {...rest} render={routeProps => renderMergedProps(component, routeProps, rest) }/>;
    }
    else{
      return <Redirect to={redirectTo}/>
    }

  }

export {PropsRoute, PrivateRoute}