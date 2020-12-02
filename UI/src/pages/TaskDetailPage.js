import React, { useState, useContext, useCallback } from 'react';
import { View, ScrollView, Text, Button, Image, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Rating } from 'react-native-elements';
import { PageHeader } from '../components/PageHeader';
import Constants from 'expo-constants';
import { Button as MaterialButton } from 'react-native-material-ui';
import { EventRegister } from 'react-native-event-listeners';
import { UserContext } from '../components/UserContext';
import Modal from 'react-native-modal';

/**
 *
 * TaskDetailPage is a extended page that can be called by other pages to show more detail information for one task object.
 *
 * @export
 * @param {{route: {params: {task: Object}}, navigation: Object}} props <br>
 * 1. props.route.params.task:
 *     {
 *          publisher: String,
 *          publisherUID: number,
 *          receiverUID: number,
 *          taskID: number,
 *          avatar: string,
 *          rating: number,
 *          coins: number,
 *          cost: number,
 *          datetime: datetime,
 *          title: string,
 *          description: string,
 *          img: string[],
 *     }
 * 2. props.navigation is generated by the stack navigator in React-Navigation used to redirect to other pages.
 * @return {Component} => Render a TaskDetailPage to show the details of one task.
 */
export function TaskDetailPage(props) {
    const {task} = props.route.params;
    const [user, chatList, taskList] = useContext(UserContext);
    const isMyTask = (task['publisherUID'] === user['UID']);
    const isAcceptedTask = (task['receiverUID'] === user['UID']);
    const [isModalVisiable, setIsModalVisiable] = useState(false);
    const [refreshing, setRefreshing] = React.useState(false);
    const wait = useCallback((timeout) => {
        return new Promise(resolve => {
          setTimeout(resolve, timeout);
        });
    },[]);
    const onRefresh = useCallback(() => {
        EventRegister.emit('refreshTaskList');
        setRefreshing(true);
        wait(2000).then(() => setRefreshing(false));
    }, []);

    return (
        <View style={{flex: 1, justifyContent: 'space-between', backgroundColor: 'white'}}>
            <Modal isVisible={isModalVisiable}
                    onBackdropPress={() => setIsModalVisiable(false)}>
                    <View style={{backgroundColor:'white', height: '20%', justifyContent:'space-around'}}>
                        <Text>Please rate your helper</Text>
                        <Rating
                            type='heart'
                            ratingCount={5}
                            imageSize={30}
                            fractions={1}
                            startingValue={0}
                            showRating
                        />
                        <Button title='Confirm' onPress={() => setIsModalVisiable(false)}/>
                    </View>
            </Modal>
            <PageHeader style={{flex: 1}}
                leftComp={<Button title='Back' onPress={() => props.navigation.goBack()} />}
                centerComp={<Text style={{fontSize:20}}>Details</Text>}
            />
            <View style={{flex: 9}}>
                <View style={styles.userInfoView}>
                    <TouchableOpacity 
                        style={styles.avatarTouchable}
                        onPress={() => {
                            props.navigation.navigate('UserDetailPage', {userUID: task.publisherUID});
                        }}>
                        <Image source={{ uri: task.avatar }} style={styles.avatarStyle} resizeMode='cover'/>
                    </TouchableOpacity>
                    
                        <View style={{flexDirection: "row", justifyContent:'space-between', width: "85%"}}>
                            <View style={styles.userRatingView}>
                                <Text style={{ fontSize: 20, textAlign: 'center'}}>{task.publisher}</Text>
                                <Text style={{ fontSize: 20 }}>👏🏻 {task.coins}</Text>
                            </View>
                            <View style={{alignItems: 'flex-end', right: 10}}>
                                <Text>Award 👏🏻 {task.cost}</Text>
                                <Rating
                                    type='heart'
                                    readonly
                                    ratingCount={5}
                                    imageSize={18}
                                    fractions={1}
                                    startingValue={task.rating}
                                    showRating
                                    showReadOnlyText={false}
                                />
                            </View>
                    </View>
                </View>
                <ScrollView 
                    contentContainerStyle={{paddingBottom:Constants.statusBarHeight}}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >            
                    <View style={styles.taskInfoView}>
                        <Text style={styles.taskTitleStyle}>{task.title}</Text>
                        <Text style={styles.taskTextBoxStyle}>{task.description}</Text>
                        <View>
                            <View style={styles.imageVerticalView}>
                                <View style={styles.imageHorizontalView}>
                                    {task.img.length >= 1 && <Image source={{ uri: task.img[0] }} style={styles.imageStyle} />}
                                    {task.img.length >= 2 &&<Image source={{ uri: task.img[1] }} style={styles.imageStyle} />}
                                </View>
                                <View style={styles.imageHorizontalView}>
                                    {task.img.length >= 3 &&<Image source={{ uri: task.img[2] }} style={styles.imageStyle} />}
                                    {task.img.length >= 4 && <Image source={{ uri: task.img[3] }} style={styles.imageStyle} />}
                                </View>
                            </View>
                        </View>

                        <View style={styles.buttonView}>
                            <MaterialButton text={"❤️ Likes "} style={materialButtonStyle}
                                            onPress={() => {}}/>
                            <MaterialButton text="💬 Message" style={materialButtonStyle}
                                            onPress={() => {
                                                    let chat_index = -1;
                                                    chatList.forEach((chat, i) => {
                                                        if(chat['UID'] === task['publisherUID']) {
                                                            chat_index = i;
                                                            props.navigation.navigate('ChatPage', {chat: chatList[chat_index]});
                                                        }
                                                    });
                                                    if(chat_index == -1) {
                                                        EventRegister.emit('addNewChat', [task.publisher, task.publisherUID, task.avatar, '', (new Date()).toUTCString(), props.navigation]);
                                                    }
                                                }
                                            }/>
                            {isMyTask && task.receiverUID !== -1  && <MaterialButton text="👌 Done" 
                                    style={{container:{...materialButtonStyle.container, borderRightWidth:0},
                                            text: materialButtonStyle.text}}
                                    onPress={() => {
                                        EventRegister.emit('editTask', ['finishTask', user.UID, task.taskID])
                                        setIsModalVisiable(true);
                                        props.navigation.goBack()
                                    }}
                            />}
                            {isMyTask && task.receiverUID === -1 && <MaterialButton text="❌ Delete" 
                                    style={{container:{...materialButtonStyle.container, borderRightWidth:0},
                                            text: materialButtonStyle.text}}
                                    onPress={() => {
                                        EventRegister.emit('editTask', ['deleteTask', user.UID, task.taskID])
                                        props.navigation.goBack()
                                    }}
                            />}
                            {isAcceptedTask && !isMyTask && <MaterialButton text="❌ Cancel" 
                                    style={{container:{...materialButtonStyle.container, borderRightWidth:0},
                                            text: materialButtonStyle.text}}
                                    onPress={() => {
                                        EventRegister.emit('editTask', ['cancelAccept', user.UID, task.taskID])
                                        props.navigation.goBack()
                                    }}   
                            />}
                            {!isMyTask && !isAcceptedTask && <MaterialButton text="✅ Accept" style={{container:{...materialButtonStyle.container, borderRightWidth:0},
                                    text: materialButtonStyle.text}}
                                    onPress={() => {
                                        EventRegister.emit('editTask', ['acceptTask', user.UID, task.taskID])
                                        props.navigation.goBack()
                                    }}/>}
                        </View>
                    </View>
            </ScrollView>
        </View>
        </View>
    );
}

const styles = StyleSheet.create({
    userInfoView: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    userRatingView: {
        flex: 6,
        justifyContent: 'space-evenly',
        alignItems:'flex-start',
        left: 20,
    },
    avatarTouchable: {
        flex: 1,
        left: 10,
    },
    avatarStyle: {
        borderWidth: 2,
        borderRadius: 15,
        width: 60,
        height: 60
    },
    taskInfoView: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
    },
    taskTitleStyle: {
        fontSize: 20,
        padding: 10
    },
    taskTextBoxStyle: {
        padding: 10,
    },
    imageVerticalView: {
        flexDirection: 'column',
        justifyContent: 'flex-start'
    },
    imageHorizontalView: {
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    imageStyle: {
        width: '50%',
        height: 200,
        resizeMode: 'cover'
    },
    buttonView: {
        margin: 10,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        height: 35,
        borderWidth: 1,
        borderRadius: 10
    }
})

const materialButtonStyle = {
    container: {flex:3, borderRightWidth: 1, height: '100%'},
    text: {fontSize: 12, right: 8}
}