import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Image, Text, TextInput, View, Button, ScrollView,TouchableOpacity, Linking, ListView} from 'react-native';
import {useState, useEffect} from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as SQLite from "expo-sqlite";

SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("db.db");
  return db;
}

const db = openDatabase();

function HomeScreen({ navigation }) {
  const [name, setName] = useState("");
  const [pressed, setPressed] = useState(false);
  const [ID, setID] = useState("");
  
  const onPress = () => {
    setPressed(true);
  }

  const onChangeName = newName => {
    setPressed(false);
    setName((newName));
  }

  const onChangeID = newID => {
    setPressed(false);
    setID((newID));
    }

  const onChangeSearch = newSearch => {
    setPressed(false);
    setSearch((newSearch));
  }
  

  const img = require('./assets/marine-life.jpg')
  const url = ('https://marineliferescueproject.org/')

  return (
    <View style={{justifyContent: 'center' }}>
      <View>
      <TextInput style={styles.textbox} placeholder="Name" onChangeText={onChangeName}></TextInput>
      <TextInput style={styles.textbox} placeholder="Employee ID" onChangeText={onChangeID}></TextInput>
      </View>

      <Pressable style={styles.button}
        title="Submit"
        onPress={() => {
          /* 1. Navigate to the Details route with params */
          navigation.navigate('Tracker', {name: name, ID: ID})
          }
        }>
        <Text style={styles.buttontext}>Submit</Text>
        </Pressable>

        <Image source={img} style={styles.image}></Image>
        <Text style={styles.link} onPress={() => Linking.openURL(url)}>{url}</Text>

    </View>
  );
}

function Items() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select key, species, age, date(itemDate) as itemDate from records order by itemDate desc;`,
        [],
        (_, { rows: { _array } }) => setItems(_array)
      );
      
    });
  }, []);

  if (items === null || items.length === 0) {
    return null;
  }
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Rescue History</Text>
      {items.map(({ key,species,age,itemDate }) => (
          <Text style={styles.history}key={key}>{itemDate}: (S:{species}, A:{age})</Text>
      ))}
    </View>
  );
}

function TrackerScreen({ route, navigation }) {
  const {name} = route.params;
  const {ID} = route.params;
  const [species, setSpecies] = useState(null);
  const [age, setAge] = useState(null);
  const [yourRescue, setyourRescue] = useState(null);
  const [forceUpdate, forceUpdateId] = useForceUpdate();
  const [search, setSearch] = useState(null);
  const [yourSearch, setYourSearch] = useState(null);
  const [average, setAverage] = useState(null);
  
    useEffect(() => {
      db.transaction((tx) => {
        //tx.executeSql(
          //"drop table records;"
        //);
        tx.executeSql(
          "create table if not exists records (key integer primary key not null,species not null,age int, itemDate real);"
        );
      });
    }, []);
  
    const add = (age, species) => {
      if (age === "" || age === null || species === "" || species === null) {
        return false;
      } else {
        db.transaction(
          (tx) => {
            tx.executeSql("insert into records (species,age,itemDate) values (?,?,julianday('now'))",[species, age]);
            tx.executeSql("select * from records", [], (_, { rows }) =>
              console.log(JSON.stringify(rows))
            );
          },
          null,
          forceUpdate
        )};
        const yourRescue = "You rescued a " + species + " that is " + age + " years old.";
        setyourRescue(yourRescue);
      }

      const searchSpecies = (search) => {
        if (search === "" || search === null) {
          return false;
        } else {
          console.log(search);
          db.transaction(
            (tx) => {
              tx.executeSql("select avg(age) as average from records where species = ?", [search],
              (_, { rows: { _array } }) => setAverage(_array)
              );
            
            },
            null,
            forceUpdate
          )};
          console.log(average[0].average);
        }
      


  return (
    <View>
    <Text style={styles.text3}>Employee Information</Text>
    <Text style={styles.text2}>Name: {name}</Text>
    <Text style={styles.text2}>ID: {ID}</Text>
    <ScrollView style={styles.text}>
              <TextInput
                onChangeText={(species) => setSpecies(species)}
                placeholder="Species"
                style={styles.input}
                value={species}
              />
              <TextInput
                onChangeText={(age) => setAge(age)}
                placeholder="Age in Years"
                style={styles.input}
                value={age}
              />
            <TouchableOpacity 
              onPress={() => {add(age, species),setSpecies(null),setAge(null)}} style={styles.button}>
              <Text style={styles.buttontext}>Add Rescue</Text>
            </TouchableOpacity>
            <TextInput
          onChangeText={(search) => setSearch(search)}
          placeholder='Search for a rescued species'
          style={styles.input}
          value={search}
            />
            <TouchableOpacity 
              onPress={() => {searchSpecies(search)}} style={styles.button}>
              <Text style={styles.buttontext}>Search</Text>
            </TouchableOpacity>
            <Text style={styles.rescue}>{yourRescue}</Text>
          <Items/>

            <Text style={styles.rescue}>{average ? "The average age of a " + search + " is " + average[0].average + " years old.": null}</Text>
            
           </ScrollView>
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen}
        options={{title: 'Marine Rescue',
        headerStyle: {
          backgroundColor: '#4ADEDE'
        },
        headerTintColor: '#FFFFFF'}}/>
        <Stack.Screen name="Tracker" component={TrackerScreen}
         options={{title: 'Marine Rescue Tracker',
         headerStyle: {
           backgroundColor: '#4ADEDE'
         },
         headerTintColor: '#FFFFFF'}}
         />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    textAlign: 'center',
  },
  history: {
    textAlign: 'center',
  },
  top: {
    fontSize: 40,
    textAlign: 'center'
  },
  text2: {
    fontSize: 25,
    textAlign: 'left',
    paddingLeft: 35
  },
  text: {
    fontSize: 35,
    paddingTop: 20,
  },
  text3: {
    fontSize: 35,
    paddingTop: 20,
    textAlign: 'center',
    },
  textbox: {
    fontSize: 25,
    textAlign: 'left',
    paddingLeft: 30,
    marginTop: 40
  },
  button: {
    backgroundColor: '#4ADEDE',
      padding: 10,
      borderRadius: 3,
      marginBottom: 30,
      marginTop: 15,
  },
  buttontext: {
    color: '#FFFFFF'
  },
  image: {
    width: 380,
    height: 300,
    marginLeft: 7,
  },
  link: {
    color: '#4ADEDE',
    textAlign: 'center',
    fontWeight: 'bold',
    fontStyle: 'italic',
    paddingTop: 40,
  },
  rescue: {
    fontSize: 20,
    textAlign: 'center',
  },
  input: {
    textAlign: 'center'
  }
});