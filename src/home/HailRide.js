import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'

import { colors, fonts } from '../theme'
import { Analytics, Auth, API } from 'aws-amplify'

const apiName = 'requestUnicorn';
const apiPath = '/ride';

class HailRide extends React.Component {
  state = {
    loading: true,
    pin: {
      latitude: '',
      longitude: ''
    },
    updates: [],
    unicornFetched: false,
    requestRideEnabled: true
  }

  componentDidMount() {
    this.getLocation()
    setInterval(() => this.getLocation, 1000 * 60 * 15)
  }

  getLocation() {
    navigator.geolocation.getCurrentPosition((res) => {
      const { latitude, longitude } = res.coords
      console.log('updating state...')
      this.setState({
        pin: {
          latitude,
          longitude,
        },
        loading: false })
      }, err => {
      console.log('error getting position...')
      this.setState({ loading: false })
    })
  }

  signOut() {
    Auth.signOut()
      .then(() => this.props.navigation.navigate('AuthNav'))
  }

  async onPress() {
    const updates = ['Requesting Unicorn...']
    try {
      this.setState({
        requestRideEnabled: false,
        updates
      });

      const data = await this.getData(this.state.pin);
      Analytics.record('Unicorn requested', { unicornName: data.Unicorn.Name})
      console.log('data from API: ', data);
      updates.push(`Your unicorn, ${data.Unicorn.Name} will be with you in ${data.Eta} seconds`);
      this.setState({ updates });

      setTimeout(() => {
        console.log('ride complete');
        const updateList = this.state.updates;
        updateList.push([ `${data.Unicorn.Name} has arrived` ]);
        this.setState({
          updates: updateList,
          requestRideEnabled: true
        });
      }, data.Eta * 1000);
    } catch (error) {
      console.error(error);
      updates.push([ 'Error finding unicorn' ]);
      this.setState({ updates });
    }
  }

  async getData() {
    const { pin } = this.state
    const body = {
      PickupLocation: {
        Longitude: pin.longitude,
        Latitude: pin.latitude
      }
    };

    return await API.post(apiName, apiPath, { body })
  }

  render() {
    console.log('updates: ', this.state.updates)
    return (
      <View>
        <View style={styles.header}>
          <Text style={styles.title}>HAIL RIDE</Text>
          <Text onPress={this.signOut.bind(this)} style={styles.signout}>Sign Out</Text>
        </View>
        {
          this.state.loading && <ActivityIndicator />
        }
        {
          !this.state.loading && (
            <View>
              <Text style={styles.locationTitle}>Your Current Location:</Text>
              <Text style={styles.latitude}>Latitude: {this.state.pin.latitude}</Text>
              <Text style={styles.longitude}>Longitude: {this.state.pin.longitude}</Text>
              {
                this.state.requestRideEnabled && (
                  <TouchableOpacity onPress={this.onPress.bind(this)}>
                    <View style={styles.button}>
                      <Text>Request Ride</Text>
                    </View>
                  </TouchableOpacity>
                )
              }

              {
                this.state.updates.map((update, index) => (
                  <Text key={index} style={styles.update}>{update}</Text>
                ))
              }
            </View>
          )
        }
      </View>
    )
  }
}

const styles = StyleSheet.create({
  update: {
    marginHorizontal: 20,
    marginVertical: 5,
    fontFamily: fonts.regular,
    fontSize: 16
  },
  locationTitle: {
    fontFamily: fonts.regular,
    textAlign: 'center',
    paddingLeft: 20,
    marginVertical: 10,
    fontSize: 20
  },
  latitude: {
    fontFamily: fonts.regular,
    margin: 5,
    paddingLeft: 15,
    fontSize: 18
  },
  longitude: {
    fontFamily: fonts.regular,
    margin: 5,
    paddingLeft: 15,
    fontSize: 18,
    paddingBottom: 15,
    borderBottomWidth: 10,
    borderBottomColor: 'black'
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.pink
  },
  title: {
    color: 'white',
    fontSize: 18,
    paddingTop: 10,
    fontFamily: fonts.regular
  },
  signout: {
    position: 'absolute',
    color: 'white',
    right: 13,
    top: 26
  },
  button: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    backgroundColor: colors.blue
  }
})

export default HailRide
