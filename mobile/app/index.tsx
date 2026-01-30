import { Link, router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1}}>
      <View
      style={{
        flex: 1,
        alignItems: "center"
      }}
      >
        <Text style={{color: "#71797E", fontWeight: "bold", fontSize: 38, justifyContent: "flex-start", paddingTop: 100}}>Hello!</Text>
      </View>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "flex-end", 
          paddingBottom: 80,
          gap: 15
        }}
      >
        <Pressable style={{backgroundColor: "#9500FF", padding: 15, borderRadius: 25, width: 300, alignItems: "center"}} onPress={() => router.push("/Login")}>
          <Text style={{color: "#FFFFFF", fontSize: 18, fontWeight: "bold"}} >Login</Text>
        </Pressable>
      <Text style={{color: "#71797E", fontSize: 16, fontWeight: "bold"}}> OR </Text>
      <Pressable style={{backgroundColor: "#570096", padding: 15, borderRadius: 25, width: 300, alignItems: "center"}} onPress={() => router.push("/SignUp")}>
        <Text style={{color: "#FFFFFF", fontSize: 18, fontWeight: "bold"}}>Sign Up</Text>
      </Pressable>
      <Link style={{color: "#71797E", fontSize: 16, fontWeight: "bold"}} href="/">Continue as a volunteer</Link>
      </View>
    </View>
  );
}
