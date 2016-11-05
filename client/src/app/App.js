import React from 'react';
import Auth from './Auth';
import Nav from './Nav';
import axios from 'axios';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {user: null, loading: true}
  }
  login(user) {
    this.setState({user: user, loading: false});
  }
  componentWillMount() {
    this.checkAuth()
  }

  checkAuth() {
    if (!this.state.user) {
      console.log('no user')
    axios.get('http://localhost:3000/api/users/auth')
      .then(response => {
        this.login(response.data);
        this.setState({loading: false})
      })
      .catch(err => {
        console.error(err);
        this.setState({loading: false})
      })
    }
  }
  render() {
    if (!this.state.loading) {
      if (!this.state.user) {
        return <Auth login={this.login.bind(this)}/>
      }
      else {
        return (<div>
          <Nav signOut={this.login.bind(this)}/>
          <div>
          {this.props.children &&  React.cloneElement(this.props.children, {
            user: this.state.user
          })}
          </div>
          </div>
        )
      }
    } else {
      return <div>Loading</div>
    }
  }
}
