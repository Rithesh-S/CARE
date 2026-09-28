class UserModel {
  final String? id;
  final String role; // 'STUDENT', 'STAFF', 'ADMIN'
  final String? email;
  final String? name;
  final String? hashedStudentId;
  final String? displayId;

  UserModel({
    this.id,
    required this.role,
    this.email,
    this.name,
    this.hashedStudentId,
    this.displayId,
  });

  bool get isStudent => role == 'STUDENT';
  bool get isStaff => role == 'STAFF' || role == 'ADMIN';
  bool get isAdmin => role == 'ADMIN';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? json['_id'],
      role: json['role'] ?? 'STUDENT',
      email: json['email'],
      name: json['name'],
      hashedStudentId: json['hashed_student_id'],
      displayId: json['display_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'role': role,
      'email': email,
      'name': name,
      'hashed_student_id': hashedStudentId,
      'display_id': displayId,
    };
  }
}
