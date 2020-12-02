import React, { useState, useCallback, useContext, useMemo } from 'react';
import { View, Button, TextInput, Platform, Image, Alert, TouchableOpacity, Text } from 'react-native';
import { PageHeader } from '../components/PageHeader';
import RNPickerSelect from 'react-native-picker-select';
import { UserContext } from '../components/UserContext';
import { EventRegister } from 'react-native-event-listeners';
import * as expoImagePicker from 'expo-image-picker';

/**
 * PublishPage is not an observer as other pages. However, it will collect the new task inputs from the user.
 * Then, it will publish the new task and a new post request to the server. 
 * The server will then notify App.js as soon as it receives the new task information.
 * 
 * @export
 * @param {{navigation: Object}} props props.navigation is generated by the stack navigator in React-Navigation used to redirect to other pages.
 * @return {Component} => Render a PublishPage component with imagePicker and button to help post new task.
 */
export function PublishPage(props) {
  const [imageArray, setImageArray] = useState([null, null, null, null]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pickerValue, setPickerValue] = useState();
  const [user, chatList, taskList] = useContext(UserContext);
  
  const pickerItems = useMemo(() => {
    let items = []
    if(user.coins <= 0) {
      items.push({ label: '0', value: 0 });
    }
    else {
      for(let i = 0;i < user.coins+1;i++) {
        items.push({ label: i.toString(), value: i });
      }
    }
    return items;
  }, [])

  let setParentImageArray = useCallback((images) => {
    setImageArray(images);
  }, [])

  return (
    <View style={{flex:1, backgroundColor: 'white'}}>
        <PageHeader
            leftComp={<Button title='Back' onPress={() => props.navigation.goBack()} />}
            rightComp={<Button title='Publish' onPress={() => {
                if(publish(title, description, pickerValue, imageArray, user.UID)) {
                  props.navigation.goBack();
                }
              }}
            />}
        />
        <View style={{flexDirection:'row', justifyContent:'space-between', padding:15}}>
          <Text style={{flex:1, fontSize:30}}>Title: </Text>
          <TextInput
            placeholder='Required'
            style={{flex:4, fontSize:24,borderBottomWidth:1, borderBottomColor:'black'}}
            autoFocus={true}
            multiline={false}
            clearButtonMode='always'
            numberOfLines={1}
            enablesReturnKeyAutomatically={true}
            onChangeText={(text) => {setTitle(text);}}
          />
        </View>
        <TextInput
            placeholder='Description'
            style={{padding:15, fontSize:20, height: '20%',}}
            clearButtonMode='always'
            multiline={true}
            numberOfLines={15}
            enablesReturnKeyAutomatically={true}
            onChangeText={(text) => {setDescription(text);}}
        />
        <View style={{flexDirection:'row', alignSelf: 'flex-end', margin: 10}}>
          <Text>Award 👏🏻 </Text>
          <RNPickerSelect
            onValueChange={(value) => setPickerValue(value)}
            items={pickerItems}
        />
        </View>
        <ImagePicker setParentImageArray={setParentImageArray}/>
    </View>
  );
}

/**
 * It will encapsulate the new task inputs and send a post request to the server to update the taskList.
 *
 * @param {string} title
 * @param {string} description
 * @param {number} cost
 * @param {string[]} images
 * @param {number} userUID
 * @return {boolean} 
 */
function publish(title, description, cost, images, userUID) {
  if(title.length == 0 || description.length == 0) {
    alert("Title or description cannot be empty.");
    return false;
  }
  if(cost == null || cost > userUID) {
    alert("Please select the award for this task.");
    return false;
  }
  const data = new FormData();
  data.append('func', 'sendTask');
  data.append('UID', userUID);
  data.append('title', title);
  data.append('body', description);
  data.append('cost', cost);
  let count = 0;
  images.forEach((img, i) => {
    if(img != null) {
      count++;
      data.append(i.toString(), {
        uri: img,
        type: 'image/jpeg',
        name: img
      });
    }
  });
  data.append('image_count', count);
  
  fetch('http://34.94.101.183:80/WeHelp/', {
      method: 'POST',
      body: data,
      headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
          //'contentType': false,
          //'processData': false,
          //'mimeType': 'multipart/form-data',
          //'cache-control': 'no-cache',
      },
  }).then(async(resp) => {
    let found = await resp.json();
    if(found['success'] == 1) {
      EventRegister.emit('refreshTaskList');
      EventRegister.emit('updateUser');
    }
  })
  .catch(()=>{alert("Post Task Failed");});
  return true;
}

/**
 * It will check whether the application is allowed to acess image library in the device.
 * 
 * @param {none}
 * @return {boolean} 
 */
let checkImagePermission = async () => {
  if (Platform.OS !== 'web') {
    const status = await expoImagePicker.requestCameraRollPermissionsAsync();
    if (status.accessPrivileges === 'none') {
      alert('Photo permission is required to upload photos');
      return false;
    }
  }
  return true;
};

/**
 * ImagePicker is a helper component that generates four TouchableOpacity that allow user to upload up to four images for the new task.
 * 
 * @param {{setParentImageArray: Function}} props props.setParentImageArray is a callback function that sets the parent component which is PublishPage's image array.
 * @return {Component} => Render a ImagePicker to help user to upload up to four images
 */
function ImagePicker(props) {
  const [imageArray, setImageArray] = useState([null, null, null, null]);
  const [imageCount, setImageCount] = useState(0);

  const pickImage = useCallback(async (index, incrementCount) => {
    let hasPermission = await checkImagePermission();
    if (hasPermission) {
      let result = await expoImagePicker.launchImageLibraryAsync({
        mediaTypes: expoImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
  
      if (!result.cancelled) {
        let array = Array.from(imageArray);
        array[index] = result.uri;
        if(incrementCount) {
          setImageCount(imageCount+1)
        }
        setImageArray(array);
        props.setParentImageArray(array);
      }
    }
  }, [imageArray]);

  const DeleteImage = useCallback(async(index) => {
    let array = Array.from(imageArray);
    let moveForward = false;
    for (let i =0;i < imageCount-1;i++) {
      if (i == index) {
        moveForward = true
      }
      if (moveForward) {
        array[i] = array[i+1]
      }
    }
    array[imageCount-1] = null;
    setImageCount(imageCount-1)
    setImageArray(array)
    props.setParentImageArray(array);
  }, [imageArray]);

  const pressImage = useCallback(async(index) => {
    if(Platform.OS === 'web') {
      alert('Cannot modify image on web at this point');
    }
    else {
      Alert.alert('Image Options',
      '',
      [
        {
          text: 'Reselect Image',
          onPress: async() => await pickImage(index, false)
        },
        {
          text: 'Delete Image',
          onPress: () => DeleteImage(index)
        },
        { text: 'Cancel',
          style: 'cancel'
        }
      ],
      { cancelable: true })
    }
  }, [imageArray]);

  const imageStyle = { width: 100, height: 100 };
  
  return (
    <View style={{padding:10}}>
      <View style={{flexDirection: 'row', justifyContent: 'flex-start'}}>
        {imageArray[0] && 
          <TouchableOpacity onPress={()=>{pressImage(0)}}>
            <Image source={{ uri: imageArray[0] }} style={imageStyle}/>
          </TouchableOpacity>
        }
        {imageArray[1] && 
          <TouchableOpacity onPress={()=>{pressImage(1)}}>
            <Image source={{ uri: imageArray[1] }} style={imageStyle}/>
          </TouchableOpacity>
        }
        {imageArray[2] && 
          <TouchableOpacity onPress={()=>{pressImage(2)}}>
            <Image source={{ uri: imageArray[2] }} style={imageStyle}/>
          </TouchableOpacity>
        }
        {imageArray[3] && 
          <TouchableOpacity onPress={()=>{pressImage(3)}}>
            <Image source={{ uri: imageArray[3] }} style={imageStyle}/>
          </TouchableOpacity>
        }
        { imageCount < 4 &&  <Button title='Select photo' onPress={() => {pickImage(imageCount, true);}} />}
      </View>
    </View>
  );
}
