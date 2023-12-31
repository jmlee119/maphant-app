import { AntDesign } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import CheckBox from "expo-checkbox";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import FontAwesome from "react-native-vector-icons/FontAwesome";

import { boardEdit } from "../../Api/board";
import { uploadAPI } from "../../Api/Image";
import { Container, Input, Spacer, TextButton } from "../../components/common";
import { NavigationProps } from "../../Navigator/Routes";
import { BoardPost } from "../../types/Board";

const Edit: React.FC = () => {
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [checkList, setCheckList] = useState<string[]>([]);
  const [isHide, setIsHide] = useState<number>(0);
  const [isAnonymous, setIsAnonymous] = useState<number>(0);
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);

  const [requsetpermission, setRequestPermission] = ImagePicker.useCameraPermissions();
  const [imageUrl, setImageUrl] = useState<string[]>([]);

  const [postImageUrl, setPostImageUrl] = useState<string[]>([]);

  const navigation = useNavigation<NavigationProps>();

  const editparams = useRoute().params as { post: BoardPost };
  const post = editparams?.post;

  useEffect(() => {
    // 받아온 게시판 타입(boardType)을 이용하여 필요한 작업 수행
    setTitle(post.board.title);
    setBody(post.board.body);
    setIsHide(post.board.isHide);
    setIsAnonymous(post.board.isAnonymous);
    if (post.board.imagesUrl) setPostImageUrl(post.board.imagesUrl);
    if (post.board.tags) setHashtags(post.board.tags.map(word => "#" + word.name));
  }, []);

  const check = (name: string, isChecked: boolean) => {
    if (isChecked) {
      setCheckList([...checkList, name]);
    } else {
      setCheckList(checkList.filter(choice => choice !== name));
    }
  };

  const handleUpdate = async () => {
    const DBnewHashtags = hashtags.map(word => word.replace(/^#/, ""));
    try {
      const response = await boardEdit(
        post.board.id,
        title,
        body,
        isHide,
        postImageUrl.length == 0 ? undefined : postImageUrl,
        DBnewHashtags.length == 0 ? undefined : DBnewHashtags,
      );
      if (response.success == true) {
        Alert.alert("수정되었습니다.");
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert(error);
    }
  };
  const updateHashtags = () => {
    const words = hashtagInput.split(" ");
    const newHashtags = words.filter(word => word.startsWith("#"));
    setHashtags(prevHashtags => [...prevHashtags, ...newHashtags]);
  };

  const addHashtag = () => {
    if (hashtagInput.trim() !== "") {
      updateHashtags();
      setHashtagInput("");
    }
  };

  const deleteHashtag = (indexToRemove: number) => {
    const newHashtags = hashtags.filter((_, index) => index !== indexToRemove);
    setHashtags(newHashtags);
  };

  const updateImageUrl = (newImageUrl: string[]) => {
    setPostImageUrl(newImageUrl);
    setImageUrl(newImageUrl);
  };

  const uploadImage = async () => {
    if (!requsetpermission?.granted) {
      const permission = await setRequestPermission();
      if (!permission.granted) {
        return null;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    //이미지 업로드 취소시
    if (result.canceled) {
      return null;
    }
    const selectedImages = result.assets.slice(0, 5);

    try {
      // Call the uploadImageAsync function to upload the selected images
      await uploadImageAsync(selectedImages);
    } catch (error) {
      Alert.alert(error);
      // Handle the error
    }
    setImageUrl(selectedImages.map(image => image.uri));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function uploadImageAsync(images: any[]) {
      const formData = new FormData();

      images.forEach((image, index) => {
        // @ts-expect-error
        formData.append("files", {
          uri: image.uri,
          type: "image/jpeg",
          name: `image_${index + 1}.jpg`,
        });
      });

      try {
        const response = uploadAPI("POST", "/image", formData);
        const jsonResponse = (await response).json;
        for (const item of jsonResponse) {
          const imageUrl = item.url;
          postImageUrl.push(imageUrl);
          updateImageUrl(postImageUrl);
        }
        setPostImageUrl(postImageUrl);
      } catch (error) {
        Alert.alert("이미지 업로드에 실패했습니다.");
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const newImageUrl = imageUrl.filter((_, index) => index !== indexToRemove);
    updateImageUrl(newImageUrl);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      style={{ padding: 5, borderRadius: 5 }}
    >
      <Container
        style={{ marginHorizontal: 15, marginVertical: 10 }}
        // isForceKeyboardAvoiding={true}
      >
        <Container style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Container
            style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 10 }}
          >
            <Container style={{ flexDirection: "row", marginRight: 10, alignItems: "center" }}>
              <CheckBox
                style={{ marginRight: 5 }}
                value={isHide == 1 ? true : false}
                onValueChange={isChecked => {
                  check("private", isChecked);
                  setIsHide(isChecked ? 1 : 0);
                }}
              ></CheckBox>
              <Text>비공개</Text>
            </Container>
            <Container style={{ flexDirection: "row", marginRight: 10, alignItems: "center" }}>
              <CheckBox
                style={{ marginRight: 5 }}
                value={isAnonymous == 1 ? true : false}
                onValueChange={isChecked => {
                  check("anonymous", isChecked);
                }}
              ></CheckBox>
              <Text>익명</Text>
            </Container>
          </Container>
          <Container style={{ flexDirection: "row" }}>
            <TouchableOpacity
              onPress={uploadImage}
              style={{ alignItems: "center", marginRight: 5 }}
            >
              <AntDesign name="camerao" size={24} color="#666666" />
              <Text style={{ color: "#666666", fontSize: 13 }}>사진 업로드</Text>
            </TouchableOpacity>
          </Container>
          <Container style={{ flexDirection: "row" }}>
            <TextButton onPress={handleUpdate}>완료</TextButton>
          </Container>
        </Container>
        <Container>
          <Input
            placeholder="제목"
            onChangeText={text => setTitle(text)}
            value={title}
            // multiline={true}
          ></Input>
          <Spacer size={20} />
          <TextInput
            placeholder="#해시태그 형식을 지켜주세요."
            onChangeText={text => setHashtagInput(text)}
            value={hashtagInput}
            // multiline={true}
            onEndEditing={addHashtag}
          ></TextInput>
          <Spacer size={10} />
          <View style={{ flexDirection: "row" }}>
            {hashtags.map((tag, index) => (
              <Text key={index} onPress={() => deleteHashtag(index)}>
                <Text style={{ backgroundColor: "#C9E4F9" }}>{tag}</Text>
                {"   "}
              </Text>
            ))}
          </View>
          <Spacer size={20} />
          <Input
            style={{ minHeight: "40%" }}
            placeholder="본문"
            onChangeText={text => setBody(text)}
            value={body}
            multiline={true}
          ></Input>
          <ScrollView horizontal={true} style={{ flexDirection: "row" }}>
            <Spacer size={20} />
            {Array.isArray(postImageUrl) &&
              postImageUrl.map((uri, index) => (
                <>
                  <Image
                    source={{ uri: uri }}
                    style={{ width: 200, height: 200, marginRight: 5 }} // 이미지 간 간격을 조절해줍니다.
                  />
                  <FontAwesome
                    name="remove"
                    size={24}
                    color="black"
                    onPress={() => handleRemoveImage(index)}
                  />
                </>
              ))}
          </ScrollView>
        </Container>
      </Container>
    </KeyboardAvoidingView>
  );
};

export default Edit;
