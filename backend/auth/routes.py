from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from core.database import get_db
from auth import schemas, models
from auth import utils


router = APIRouter()


@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.RegLogUser, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = utils.hash_password(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.TokenPair)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not db_user or not utils.verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    access_token = utils.create_access_token(data={"sub": db_user.username})
    refresh_token = utils.create_refresh_token(data={"sub": db_user.username})

    response = JSONResponse(content={"message": "Login successful"})
    response.set_cookie("access_token", access_token, httponly=True, max_age=900, samesite="Lax")
    response.set_cookie("refresh_token", refresh_token, httponly=True, max_age=7*24*60*60, samesite="Lax")

    if db_user.hashed_mattermost_token:
        mattermost_token = utils.decrypt_token(db_user.hashed_mattermost_token)
        response.set_cookie("mattermost_token", mattermost_token, httponly=True, max_age=7*24*60*60, samesite="Lax")
    
    return response


@router.post("/refresh", response_model=schemas.Token)
def refresh_token(request: Request):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    
    try:
        username = utils.verify_refresh_token(refresh_token)
    
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    access_token = utils.create_access_token(data={"sub": username})

    response = JSONResponse(content={"message": "Refreshed"})
    response.set_cookie("access_token", access_token, httponly=True, max_age=900, samesite="Lax")
    return response


@router.post("/logout")
def logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    response.delete_cookie("mattermost_token")
    return response


@router.get("/me", response_model=schemas.UserOut)
def current_user(current_user: models.User = Depends(utils.get_current_user)):
    return current_user
