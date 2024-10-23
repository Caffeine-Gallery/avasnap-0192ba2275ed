import Blob "mo:base/Blob";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Iter "mo:base/Iter";

actor {
    // Stable variable to store avatars across upgrades
    private stable var avatarEntries : [(Nat, Blob)] = [];
    private var avatars = HashMap.HashMap<Nat, Blob>(0, Nat.equal, Hash.hash);
    private stable var nextId : Nat = 0;

    // System functions for upgrades
    system func preupgrade() {
        avatarEntries := Iter.toArray(avatars.entries());
    };

    system func postupgrade() {
        avatars := HashMap.fromIter<Nat, Blob>(avatarEntries.vals(), 0, Nat.equal, Hash.hash);
        avatarEntries := [];
    };

    // Upload a new avatar image
    public shared func uploadAvatar(imageBlob : Blob) : async Nat {
        let id = nextId;
        avatars.put(id, imageBlob);
        nextId += 1;
        id
    };

    // Retrieve an avatar by ID
    public query func getAvatar(id : Nat) : async ?Blob {
        avatars.get(id)
    };

    // Get all avatar IDs
    public query func getAllAvatarIds() : async [Nat] {
        Iter.toArray(avatars.keys())
    };
}
