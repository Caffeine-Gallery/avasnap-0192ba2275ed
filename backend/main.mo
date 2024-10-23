import Text "mo:base/Text";

import Blob "mo:base/Blob";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Result "mo:base/Result";

actor {
    private stable var avatarEntries : [(Nat, Blob)] = [];
    private var avatars = HashMap.HashMap<Nat, Blob>(0, Nat.equal, Hash.hash);
    private stable var nextId : Nat = 0;

    // Maximum file size (10MB in bytes)
    private let MAX_FILE_SIZE : Nat = 10 * 1024 * 1024;

    system func preupgrade() {
        avatarEntries := Iter.toArray(avatars.entries());
    };

    system func postupgrade() {
        avatars := HashMap.fromIter<Nat, Blob>(avatarEntries.vals(), 0, Nat.equal, Hash.hash);
        avatarEntries := [];
    };

    // Upload a new avatar image with error handling
    public shared func uploadAvatar(imageBlob : Blob) : async Result.Result<Nat, Text> {
        try {
            // Validate file size
            if (Blob.toArray(imageBlob).size() > MAX_FILE_SIZE) {
                return #err("File size exceeds maximum limit of 10MB");
            };

            // Store the avatar
            let id = nextId;
            avatars.put(id, imageBlob);
            nextId += 1;
            Debug.print("Successfully uploaded avatar with ID: " # Nat.toText(id));
            #ok(id)
        } catch (e) {
            Debug.print("Error uploading avatar: " # Error.message(e));
            #err("Failed to process image: " # Error.message(e))
        }
    };

    // Retrieve an avatar by ID with error handling
    public query func getAvatar(id : Nat) : async Result.Result<Blob, Text> {
        switch (avatars.get(id)) {
            case (?avatar) {
                #ok(avatar)
            };
            case null {
                #err("Avatar not found with ID: " # Nat.toText(id))
            };
        }
    };

    // Get all avatar IDs
    public query func getAllAvatarIds() : async [Nat] {
        Iter.toArray(avatars.keys())
    };
}
