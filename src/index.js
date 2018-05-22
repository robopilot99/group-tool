import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

var _ = require('lodash');
var storage = window.localStorage;

class App extends React.Component{
  constructor(props) {
    super(props);
    this.checkboxChange = this.checkboxChange.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.addUser = this.addUser.bind(this);
    this.updateGroupSize = this.updateGroupSize.bind(this);

    this.addRoster = this.addRoster.bind(this);
    this.removeRoster = this.removeRoster.bind(this);

    this.rosterChange = this.rosterChange.bind(this);
    this.setModeDistribute = this.setModeDistribute.bind(this);
    this.setModeRemainder = this.setModeRemainder.bind(this);

    this.groupUsers = this.groupUsers.bind(this);

    let rosterData = JSON.parse(storage.getItem("rosters"));
    if(!rosterData){
      rosterData =  {
        group:[ 
          {name:"Alice", exclude:false},
          {name:"Bob", exclude:false},
          {name:"Carol", exclude:false},
          {name:"Dan", exclude:false},
          {name:"Eve", exclude:false},
          {name:"Faythe", exclude:false},
          {name:"Grace", exclude:false},
          {name:"Heidi", exclude:false},
          {name:"Judy", exclude:false},
        ],
      }
    }

    this.state = {
      activeRoster: _.keys(rosterData)[0],
      rosters: rosterData,
      results: [],
      mode: "Distribute",
      groupSize: 3,
    }
  }
  
  checkboxChange(name) {
    let newState = this.state;
    const i = _.findIndex(this.state.rosters[this.state.activeRoster], { 'name' : name});
    newState.rosters[this.state.activeRoster][i].exclude = !newState.rosters[this.state.activeRoster][i].exclude;
    this.setState(newState);
  }

  rosterChange(event) {
    this.setState({
      activeRoster: event.target.value,
    }, () => this.groupUsers());
  }

  updateGroupSize(event) {
    this.setState({
      groupSize: event.target.value
    })
  }
  
  setModeRemainder(event) {
    this.setState({
      mode: "Remainder"
    })
  }
  
  setModeDistribute(event) {
    this.setState({
      mode: "Distribute"
    })
  }
  
  addUser(name){
    const newUserList = this.state.rosters[this.state.activeRoster];
    if(_.every(this.state.rosters[this.state.activeRoster], (user) => user.name !== name)){
      newUserList.push({name:name, exclude:false});
      let newRosters = this.state.rosters
      newRosters[this.state.activeRoster] = newUserList;
      this.setState({
        rosters : newRosters,
        addUserText : ''
      });
    }
    this.save();
  }

  removeUser(name){
    let newState = this.state;
    const i = _.findIndex(this.state.rosters[this.state.activeRoster], { 'name' : name});
    newState.rosters[this.state.activeRoster].splice(i, 1);
    this.setState(newState);
    this.save();
  }

  addRoster(name){
    let newState = this.state;
    newState.rosters[name] = [];
    newState.activeRoster = name;
    this.setState(newState);
    this.save();
  }

  removeRoster(){
    const keys = _.keys(this.state.rosters);
    if(keys.length < 2){
      return
    }
    let newState = this.state;
    delete newState.rosters[this.state.activeRoster];
    newState.activeRoster = _.keys(newState.rosters)[0];
    this.setState(newState);
    this.save();
  }

  groupUsers(){
    let newGroups = this.state.rosters[this.state.activeRoster];
    let groupSize = this.state.groupSize;
    if(groupSize < 1){
      groupSize = 1;
      this.setState({
        groupSize: 1,
      })
    }
    newGroups = _.filter(newGroups, (user) => !user.exclude); // remove excluded users
    const numUsers = newGroups.length;
    newGroups = _.sortBy(newGroups, () => Math.random()); // put them in random orders
    newGroups = _.chunk(newGroups, groupSize); // put them in groups
    if(this.state.mode === "Distribute" && numUsers > groupSize && numUsers % groupSize > 0 && numUsers / 2 > groupSize){ // logic to see if we can distribute
      const leftovers = newGroups.pop();
      for(var i = 0; i < leftovers.length; i++){
        newGroups[i].push(leftovers[i]);
      }
    }
    this.setState({
      results: newGroups,
    });
  }

  save(){
    storage.setItem("rosters", JSON.stringify(this.state.rosters));
  }

  render(){
    return (
      <div className="App">
        <h1>Roster select:</h1>
        <RosterForm activeRoster={this.state.activeRoster} rosterChange={this.rosterChange} addRoster={this.addRoster} removeRoster={this.removeRoster} rosters={this.state.rosters} />
        <h1>{this.state.activeRoster}:</h1>
        <EntryBox submit={(x) => this.addUser(x)}/>
        <ul><UserList users={this.state.rosters[this.state.activeRoster]} update={this.checkboxChange} remove={this.removeUser}/></ul>
        <div>
          <h2>Mode</h2>
          <div title="Automatically distribute leftovers to create groups with an extra person"><input type="radio" name="mode" value="Distribute" checked={this.state.mode === "Distribute"} onChange={this.setModeDistribute}/> Distribute </div>
          <div title="Create one group that has less then the target number"><input type="radio" name="mode" value="Remainder" checked={this.state.mode === "Remainder"} onChange={this.setModeRemainder}/> Remainder </div>
          Group Size: <input type="number" onChange={this.updateGroupSize} value={this.state.groupSize}className="numberEntry"/><br/>
          <button type="button" onClick={this.groupUsers} className="bigButton">Make Groups</button>
        </div>
        <h1>Results:</h1>
        <ResultEntry results={this.state.results}/>
      </div>
    );
  }
}

// User list

function UserList(props) {
  const users = props.users;
  if(!users){
    console.log("Nobody here");
    debugger;
    return null;
  }
  const listItems = users.map((item) =>
    <UserEntry key={item.name} name={item.name} exclude={item.exclude} update={props.update} remove={props.remove}/>
  );
  return(
    <div>{listItems}</div>
  )
}

function UserEntry(props) {
  return (<li className="UserEntry">
    {props.name}<span className="endOfLine"><input type="checkbox" checked={props.exclude} onChange={(e) => props.update(props.name)} className="excludeButton" title="Exclude this person from being added to groups"/><button className="removeButton" onClick={(e) => props.remove(props.name)}>X</button></span>
  </li>);
}

// Results list
function ResultEntry(props) {
  const groups = props.results
  let index = 1;
  const groupList = groups.map((group) => <span key={group[0].name} className="groupHeader">Group {index++}<GroupEntry users={group}/></span>);
  return (<div className="resultsDisplay">{groupList}</div>);
}

function GroupEntry(props) {
  const users = props.users
  const userList = users.map((user) => <li key={user.name}>{user.name}</li>);
  return (<ul>{userList}</ul>)
}

// Roster form
function RosterForm(props) {
  let optionList = []
  _.forOwn(props.rosters, (value,key) => {optionList.push(<option value={key} key={key}>{key}</option>)});
  return(
    <div>
      <span className="container">
        <select value={props.activeRoster} onChange={(e) => props.rosterChange(e)} className="child bigChild">
          {optionList}
        </select>
        <button onClick={() => {props.removeRoster()}} type="button" className="child smallChild">Remove</button>
      </span>
      <EntryBox submit={props.addRoster}/>
    </div>
  );
}

class EntryBox extends React.Component{
  constructor(props){
    super(props);
    this.updateText = this.updateText.bind(this);
    this.checkKeyPress = this.checkKeyPress.bind(this);

    this.state = {
      formText : ""
    }
  }

  updateText(event) {
    this.setState({
      formText: event.target.value
    });
  }

  // event to handle when user presses "Enter" inside the textbox
  checkKeyPress(event){
    if (event.key === 'Enter') {
      this.doThing();
    }
  }

  // passes the event up
  doThing(){
    if(this.state.formText !== ""){
      this.props.submit(this.state.formText);
      this.setState({
        formText: "",
      });
    }
  }

  render(props){
    return (
      <span className="container">
        <input value={this.state.formText} onChange={(e) => this.updateText(e)} onKeyPress={this.checkKeyPress} className="child bigChild"/><button onClick={() => {this.doThing()}} type="button" className="child">Add</button>
      </span>
    );
  }
}

// ========================================

ReactDOM.render(
  <App className="app"/>,
  document.getElementById('root')
);

