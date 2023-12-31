import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import Toast from "react-native-root-toast";

import { sendFcm } from "../../Api/member/Fcm";
import UserAPI from "../../Api/memberAPI";
import { Container, ImageBox, Input, Spacer, TextButton } from "../../components/common";
import { NavigationProps } from "../../Navigator/Routes";
import UIStore from "../../storage/UIStore";
import UserStorage from "../../storage/UserStorage";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigation = useNavigation<NavigationProps>();

  const loginHandler = () => {
    if (!email.match(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)) {
      Toast.show("이메일 형식을 확인해주세요", { duration: Toast.durations.SHORT });
      return;
    } else if (password.length < 4) {
      Toast.show("비밀번호는 4자리 이상 입니다", { duration: Toast.durations.SHORT });
      return;
    }
    UIStore.showLoadingOverlay();
    UserAPI.login(email, password)
      .then(res => {
        UserStorage.removeUserData();
        UserStorage.setUserToken(res["pubKey"], res["privKey"]).then(() => {
          return UserAPI.getProfile().then(res => {
            if (res.data.state === 0) {
              UserStorage.setUserProfile(res.data);
              UserStorage.getUserToken().then(() => {});
              navigation.navigate("Uncertified", { email: email, password: password });
            } else if (res.data.state === 1) {
              Notifications.getDevicePushTokenAsync().then(res => sendFcm(res.data));
              UserStorage.setUserProfile(res.data);
            }
          });
        });
      })
      .catch(message => {
        if (message == "Not found") {
          Toast.show("존재하지 않는 이메일 입니다", { duration: Toast.durations.SHORT });
          return;
        }
        if (message == "Invalid password") {
          Toast.show("비밀번호가 틀렸습니다", { duration: Toast.durations.SHORT });
          return;
        } else if (message == "탈퇴된 사용자입니다.") {
          Toast.show("탈퇴된 사용자입니다.", { duration: Toast.durations.SHORT });
          return;
        }
      })
      .finally(() => {
        UIStore.hideLoadingOverlay();
        UserStorage.loadUserDataOnStartUp();
      });
  };
  return (
    <Container isFullScreen={true} paddingHorizontal={0}>
      <ScrollView
        contentContainerStyle={{
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: "space-between",
          paddingHorizontal: 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Spacer size={40} />
          <ImageBox
            source={require("../../../assets/logo_ko.png")}
            isCenter={true}
            width={200}
          ></ImageBox>
          {/* <Spacer size={20} /> */}
          <Container style={{ width: "100%" }} isItemCenter={true} paddingHorizontal={0}>
            <Input
              style={{ paddingVertical: "5%", backgroundColor: "rgb(242,242,242)" }}
              paddingHorizontal={20}
              borderRadius={30}
              placeholder="E-MAIL"
              onChangeText={text => setEmail(text)}
              value={email}
            ></Input>
            <Spacer size={15} />
            <Input
              style={{ paddingVertical: "5%", backgroundColor: "rgb(242,242,242)" }}
              paddingHorizontal={20}
              borderRadius={30}
              placeholder="PW"
              onChangeText={text => setPassword(text)}
              value={password}
              secureTextEntry={true}
            ></Input>
            <Spacer size={20} />
            <TextButton onPress={loginHandler}>로그인</TextButton>
          </Container>
          {/* <Spacer size={20} /> */}
          <TextButton
            fontColor="#aaa"
            backgroundColor="transparent"
            paddingVertical={15}
            fontSize={16}
            onPress={() => {
              navigation.navigate("TermsSet" as never);
            }}
          >
            Dont have any account? Sign up
          </TextButton>
          <TextButton
            fontColor="#aaa"
            backgroundColor="transparent"
            paddingVertical={0}
            fontSize={16}
            onPress={() => {
              navigation.navigate("find" as never);
            }}
          >
            PW 찾기
          </TextButton>
        </View>
        <View>
          <Spacer size={40} />
        </View>
      </ScrollView>
    </Container>
  );
};

export default Login;
