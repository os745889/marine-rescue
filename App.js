import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Image, Text, TextInput, View, Button, ScrollView,TouchableOpacity} from 'react-native';
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

  const img = require('./assets/marine-life.jpg')

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

    </View>
  );
}

function Items() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select key, species, age, date(itemDate) as itemDate from history order by itemDate desc;`,
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

  const add = (age, species) => {
    if (age === "" || age === null || species === "" || species === null) {
      return false;
    }
  }

  return (
    <View>
    <Text style={styles.text}>Employee Information</Text>
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
              onPress={() => {add(species, age),setSpecies(null),setAge(null)}} style={styles.button}>
              <Text style={styles.buttonText}>Add Rescue</Text>
            </TouchableOpacity>
          <Items   
          />
           </ScrollView>
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App({age, species}) {
  const [text, setText] = useState(null);
  const [forceUpdate, forceUpdateId] = useForceUpdate();
  
    useEffect(() => {
      db.transaction((tx) => {
        tx.executeSql(
          "create table if not exists history (key integer primary key not null,species not null,age int, itemDate real);"
        );
      });
    }, []);
  

      db.transaction(
        (tx) => {
          tx.executeSql("insert into history (species,age,itemDate) values (?,?,?,julianday('now'))",[species, age]);
          tx.executeSql("select * from history", [], (_, { rows }) =>
            console.log(JSON.stringify(rows))
          );
        },
        null,
        forceUpdate
      );
  

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
    textAlign: 'left',
    paddingLeft: 20
  },
  textbox: {
    fontSize: 25,
    textAlign: 'left',
    paddingLeft: 30,
    marginTop: 40
  },
  button: {
    alignContent:'center',
    marginBottom: 40,
    padding: 8,
    justifyContent: 'center',
    backgroundColor: '#4ADEDE',
    fontSize: 50,
    marginLeft: 140,
    marginRight: 155,
    marginTop: 30,
  },
  buttontext: {
    fontSize: 25,
    color: '#FFFFFF'
  },
  image: {
    width: 380,
    height: 300,
    marginLeft: 7,
  }
});